package main

import (
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
	"log"
	"strconv"
	"sync"
)

type Client struct {
	room *Room
	ws *websocket.Conn
	wrtc *webrtc.PeerConnection
	dc *webrtc.DataChannel
	mu sync.Mutex

	id IdType
	name string
	voice bool
}

func NewClient(room* Room, ws *websocket.Conn, name string) *Client {
	client := &Client {
		room: room,
		ws: ws,

		id: room.nextClientId,
		name: name,
		voice: false,
	}
	go client.run()

	room.nextClientId += 1
	return client
}

func (c *Client) init() error {
	var err error
	r := c.room

	err = r.updateClients(joinType, c)
	if err != nil {
		return err
	}

	r.game.add(NewObjectInit(Id(playerSpace, c.id), NewVec2(5, 5), NewVec2(0.8, 1.44)))
	gameInitMsg := r.game.createGameInitMsg()
	err = c.send(&gameInitMsg)
	if err != nil {
		return err
	}

	for _, chatMsg := range(r.chat.chatQueue) {
		c.send(&chatMsg)
	}
	return err
}

func (c Client) getDisplayName() string {
	return c.name + " #" + strconv.Itoa(int(c.id))
}

func (c *Client) getClientData() ClientData {
	return ClientData {
		Id: c.id,
		Name: c.name,
	}
}

func (c *Client) initWebRTC() error {
	var err error
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302", "stun:stun2.l.google.com:19302"},
			},
		},
	}
	c.wrtc, err = webrtc.NewPeerConnection(config)
	if err != nil {
		return err
	}

	c.wrtc.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		log.Printf("Client data channel for %s has changed: %s", c.getDisplayName(), s.String())
	})

	ordered := false
	maxRetransmits := uint16(0)
	dcInit := &webrtc.DataChannelInit {
		Ordered: &ordered,
		MaxRetransmits: &maxRetransmits,
	}
	c.dc, err = c.wrtc.CreateDataChannel("data", dcInit)
	if err != nil {
		return err
	}

	c.dc.OnOpen(func() {
		err := c.init()
		if err != nil {
			log.Printf("Error initializing client: %s", err)
		}

		log.Printf("Opened data channel for %s: %s-%d", c.getDisplayName(), c.dc.Label(), c.dc.ID())
	})
	c.dc.OnMessage(func(msg webrtc.DataChannelMessage) {
		imsg := IncomingMsg{
			b: msg.Data,
			client: c,
		}
		c.room.incoming <- imsg
	})

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

func (c *Client) processWebRTCOffer(json interface{}) error {
	offer, ok := json.(map[string]interface{})
	if !ok {
		return fmt.Errorf("Unable to parse offer: %+v", json)
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
	return nil
}

func (c *Client) processWebRTCCandidate(json interface{}) error {
	candidate, ok := json.(map[string]interface{})
	if !ok {
		return fmt.Errorf("Unable to parse offer message: %+v", json)
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

func (c *Client) send(msg interface{}) error {
	b := Pack(msg)
	return c.sendBytes(b)
}

func (c *Client) sendBytes(b []byte) error {
	// TODO: if locking impacts performance, can try creating separate thread that reads a channel and sends bytes
	c.mu.Lock()
	err := c.ws.WriteMessage(websocket.BinaryMessage, b)
	c.mu.Unlock()

	if err != nil {
		log.Printf("error writing out message: %v", err)
	}
	return err
}

func (c *Client) run() {
	defer func() {
		c.room.unregister <- c
		c.ws.Close()

		if c.dc != nil {
			c.dc.Close()
		}
	}()

	for {
		_, b, err := c.ws.ReadMessage()

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("unexpected socket error: %v", err)
			}
			return
		}

		imsg := IncomingMsg{
			b: b,
			client: c,
		}
		c.room.incoming <- imsg
	}
}