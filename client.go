package main

import (
	"errors"
	"fmt"
	"github.com/gorilla/websocket"
	"github.com/pion/webrtc/v3"
	"log"
	"strconv"
	"strings"
	"sync"
)

// Incoming client message to parse
type IncomingMsg struct {
	b []byte
	client *Client
}

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

func NewClient(room* Room, ws *websocket.Conn, name string, id IdType) *Client {
	client := &Client {
		room: room,
		ws: ws,
		wrtc: nil,
		dc: nil,

		id: id,
		name: name,
		voice: false,
	}
	go client.run()
	return client
}

func (c *Client) run() {
	defer func() {
		c.room.unregister <- c
	}()

	for {
		_, b, err := c.ws.ReadMessage()

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.print(fmt.Sprintf("unexpected socket error: %v", err))
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

func (c Client) GetDisplayName() string {
	return c.name + " #" + strconv.Itoa(int(c.id))
}

func (c *Client) GetClientData() ClientData {
	return ClientData {
		Id: c.id,
		Name: c.name,
	}
}

func (c *Client) Send(msg interface{}) error {
	b := Pack(msg)
	return c.SendBytes(b)
}

func (c *Client) SendBytes(b []byte) error {
	// Lock required to synchronize writes from room and WebRTC callbacks
	c.mu.Lock()
	err := c.ws.WriteMessage(websocket.BinaryMessage, b)
	c.mu.Unlock()
	return err
}

func (c *Client) SendUDP(msg interface{}) error {
	b := Pack(msg)
	return c.SendBytesUDP(b)
}

func (c *Client) SendBytesUDP(b []byte) error {
	if c.dc == nil {
		return errors.New("Data channel not initialized")
	}
	return c.dc.Send(b)
}

func (c *Client) Close() {
	if c.dc != nil {
		c.dc.Close()
	}
	if c.wrtc != nil {
		c.wrtc.Close()
	}
	c.ws.Close()
}

func (c *Client) InitWebRTC(onSuccess func()) error {
	var err error
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{
					"stun:stun.l.google.com:19302",
					"stun:stun2.l.google.com:19302",
					"stun:openrelay.metered.ca:80",
				},
			},
		},
	}

	c.print("starting new WebRTC connection")
	c.wrtc, err = webrtc.NewPeerConnection(config)
	if err != nil {
		return err
	}

	c.wrtc.OnConnectionStateChange(func(s webrtc.PeerConnectionState) {
		c.print(fmt.Sprintf("WebRTC connection state: %s", s.String()))
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
		onSuccess()
		c.print(fmt.Sprintf("opened data channel: %s-%d", c.dc.Label(), c.dc.ID()))
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

		c.Send(&candidateMsg)
	})

	return nil
}

func (c *Client) processWebRTCOffer(json interface{}) error {
	c.print("received WebRTC offer")

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
	c.Send(&answerMsg)
	return nil
}

func (c *Client) processWebRTCCandidate(json interface{}) error {
	c.print("received WebRTC ICE candidate")

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

func (c Client) print(message string) {
   	var sb strings.Builder
   	sb.WriteString(c.room.name)
   	sb.WriteString("/")
   	sb.WriteString(c.GetDisplayName())
   	sb.WriteString(": ")
   	sb.WriteString(message)
	log.Printf(sb.String())
}