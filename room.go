package main

import (
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
	"log"
	"strings"
	"time"
)

const (
	maxChatMsgLength int = 256
	frameTime time.Duration = 25 * time.Millisecond

	pingType int = 9
	candidateType int = 10
	offerType int = 11
	answerType int = 12

	initType int = 1
	joinType int = 5
	leftType int = 6
	chatType int = 2
	keyType int = 3

	playerStateType int = 4
	playerInitType int = 8
	objectInitType int = 7
)

type PingMsg struct {
	T int
}

type JSONMsg struct {
	T int
	JSON interface{}
}

type ClientMsg struct {
	T int
	Id int
	C ClientData
	Cs map[int]ClientData
}

type ClientData struct {
	N string
}

type PlayerInitMsg struct {
	T int
	Ps map[int]PlayerInitData
}

type PlayerStateMsg struct {
	T int
	Int int
	Ps map[int]PlayerData
}

type ObjectInitMsg struct {
	T int
	Os map[int]ObjectInitData
}

type ChatMsg struct {
	T int
	Id int
	N string
	M string // message
}

type KeyMsg struct {
	T int
	K []int // keys
}

// Incoming client message to parse into
type Msg struct {
	T int
	Ping PingMsg
	JSON interface{}
	Chat ChatMsg
	Key KeyMsg
	Join ClientMsg
	Left ClientMsg
}


type Room struct {
	id string

	nextClientId int
	clients map[int]*Client

	game *Game

	incoming chan IncomingMsg
	ticker *time.Ticker
	register chan *Client
	unregister chan *Client
}

type IncomingMsg struct {
	b []byte
	client *Client
}

var rooms = make(map[string]*Room)
var replacer = strings.NewReplacer(
    "\r\n", "",
    "\r", "",
    "\n", "",
    "\v", "",
    "\f", "",
    "\u0085", "",
    "\u2028", "",
    "\u2029", "",
    "fuck", "duck",
    "shit", "poop",
)

func createOrJoinRoom(roomId string, name string, ws *websocket.Conn) {
	if rooms[roomId] == nil {
		rooms[roomId] = &Room {
			id: roomId,

			nextClientId: 0,
			clients: make(map[int]*Client),

			game: newGame(),

			incoming: make(chan IncomingMsg),
			ticker: time.NewTicker(frameTime),
			register: make(chan *Client),
			unregister: make(chan *Client),
		}

		go rooms[roomId].run()
	}

	client := &Client {
		room: rooms[roomId],
		ws: ws,
		id: rooms[roomId].nextClientId,
		name: name,
	}
	rooms[roomId].register <- client
}

func (r *Room) run() {
	defer func() {
		log.Printf("Deleting room %v", r.id)
		delete(rooms, r.id)
	}()

	for {
		select {
			case client := <-r.register:
				r.clients[client.id] = client
				err := r.initClient(client)

				if err != nil {
					delete(r.clients, client.id)
					log.Printf("Failed to create new client: %v", err)
				} else {
					log.Printf("New client for %s, %d total", r.id, len(r.clients))
				}
			case client := <-r.unregister:
				err := r.deleteClient(client)
				if err != nil {
					log.Printf("Failed to delete client %d from %s: %v", client.id, r.id, err)
				} else if len(r.clients) == 0 {
					return
				}
			case cmsg := <-r.incoming:
				msg := Msg{}
				err := Unpack(cmsg.b, &msg)
				if err != nil {
					continue
				}
				r.processMsg(msg, cmsg.client)
			case _ = <-r.ticker.C:
				r.game.updateState()
				r.sendState()
		}
	}
}

func (r* Room) processMsg(msg Msg, c* Client) {
	var err error

	switch(msg.T) {
	case pingType:
		outMsg := PingMsg {
			T: pingType,
		}
		c.send(&outMsg)
	case offerType:
		err = r.processWebRTCOffer(c, msg)
	case candidateType:
		err = r.processWebRTCCandidate(c, msg)
	case chatType:
		newMsg := replacer.Replace(msg.Chat.M)
		if len(newMsg) > maxChatMsgLength {
			newMsg = newMsg[:256]
		}

		outMsg := ChatMsg {
			T: chatType,
			Id: c.id,
			N: c.name,
			M: newMsg,
		}
		r.game.addChatMsg(outMsg)
		r.send(&outMsg)
	case keyType:
		r.game.updateKeys(c.id, msg.Key)
	default:
		log.Printf("Unknown message type %d", msg.T)
	}

	if err != nil {
		log.Printf("error when parsing message: %v", err)
		return
	}
}

func (r *Room) processWebRTCOffer(c *Client, msg Msg) error {
	offer, ok := msg.JSON.(map[string]interface{})
	if !ok {
		return fmt.Errorf("Unable to parse offer: %+v", msg.JSON)
	}
	var err error

	desc := webrtc.SessionDescription {
		Type: webrtc.SDPTypeOffer,
		SDP: offer["sdp"].(string),
	}
	err = c.wrtc.SetRemoteDescription(desc)
	if err != nil {
		return err
	}

	answer, err := c.wrtc.CreateAnswer(nil)
	if err != nil {
		return err
	}
	c.wrtc.SetLocalDescription(answer)

	answerMsg := JSONMsg {
		T: answerType,
		JSON: answer,
	}
	c.send(&answerMsg)

	c.wrtc.OnICECandidate(func(ice *webrtc.ICECandidate) {
		if ice == nil {
			return
		}

		candidateMsg := JSONMsg {
			T: candidateType,
			JSON: ice.ToJSON(),
		}
		c.send(&candidateMsg)		
	})

	return nil
}

func (r *Room) processWebRTCCandidate(c *Client, msg Msg) error {
	candidate, ok := msg.JSON.(map[string]interface{})
	if !ok {
		return fmt.Errorf("Unable to parse offer message: %+v", msg.JSON)
	}
	var err error

	sdpMid := candidate["sdpMid"].(string)
	sdpMLineIndex := uint16(candidate["sdpMLineIndex"].(int8))
	candidateInit := webrtc.ICECandidateInit {
		Candidate: candidate["candidate"].(string),
		SDPMid: &sdpMid,
		SDPMLineIndex: &sdpMLineIndex,
	}
	err = c.wrtc.AddICECandidate(candidateInit)
	if err != nil {
		return err
	}
	return nil
}

func (r *Room) initClient(c *Client) error {
	err := r.updateClients(initType, c)
	if err != nil {
		return err
	}

	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}
	c.wrtc, err = webrtc.NewPeerConnection(config)
	if err != nil {
		return err
	}

	c.wrtc.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		log.Printf("Client data channel for %d has changed: %s", c.id, s.String())
	})

	ordered := false
	maxRetransmits := uint16(0)
	dcInit := &webrtc.DataChannelInit {
		Ordered: &ordered,
		MaxRetransmits: &maxRetransmits,
	}
	c.dc, err = c.wrtc.CreateDataChannel("data", dcInit)

	c.dc.OnOpen(func() {
		log.Printf("Opened data channel for client %d: %s-%d", c.id, c.dc.Label(), c.dc.ID())
	})

	mmsg := r.game.createObjectInitMsg()
	err = c.send(&mmsg)
	if err != nil {
		return err
	}

	for _, chatMsg := range(r.game.chatQueue) {
		c.send(&chatMsg)
	}

	err = r.updateClients(joinType, c)
	if err != nil {
		return err
	}
	r.nextClientId++
	r.game.addPlayer(c)
	go c.run()

	return nil
}

func (r *Room) deleteClient(c *Client) error {
	if _, ok := r.clients[c.id]; ok {
		err := r.updateClients(leftType, c)
		if err != nil {
			return err
		}
		r.game.deletePlayer(c)
		delete(r.clients, c.id)
		log.Printf("Unregistering client %d total", len(r.clients))
	}
	return nil
}

func (r *Room) updateClients(msgType int, c *Client) error {
	msg := ClientMsg {
		T: msgType,
		Id: c.id,
		C: ClientData {
			N: c.name,
		},
		Cs: make(map[int]ClientData, 0),
	}
	for id, client := range r.clients {
		if msgType == leftType && id == c.id {
			continue
		}
		msg.Cs[id] = ClientData {N: client.name}
	}

	if msgType == initType {
		return c.send(&msg)
	} else {
		r.send(&msg)
		return nil
	}
}

func (r* Room) sendState() {
	msg := r.game.createPlayerStateMsg()
	r.sendUDP(&msg)
}

func (r *Room) send(msg interface{}) {
	b := Pack(msg)
	for _, c := range(r.clients) {
		c.sendBytes(b)
	}
}

func (r *Room) sendUDP(msg interface{}) {
	b := Pack(msg)
	for _, c := range(r.clients) {
		c.dc.Send(b)
	}
}