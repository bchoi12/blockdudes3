package main

import (
	"github.com/gorilla/websocket"
	"github.com/vmihailenco/msgpack/v5"
	"log"
)

const (
	upAcc float64 = 16.0
	downAcc float64 = -upAcc
	maxVerticalVel = 6.0

	leftAcc float64 = -16.0
	rightAcc float64 = -leftAcc
	maxHorizontalVel = 6.0

	minStopSpeedSquared float64 = 0.2 * 0.2

	friction = 0.15
)

type Client struct {
	room *Room
	ws *websocket.Conn

	id int
	name string

	pd PlayerData
	keys map[int]bool
}

func (c *Client) send(data []byte) error {
	err := c.ws.WriteMessage(websocket.BinaryMessage, data)

	if err != nil {
		log.Printf("error writing out message: %v", err)
	}
	return err
}

func (c* Client) init(r *Room) {
	cmsg := r.createClientMsg(initType, c)
	b, err := msgpack.Marshal(&cmsg)
	if err != nil {
		return
	}
	err = c.send(b)
	if err != nil {
		log.Printf("error initializing client: %v", err)
		return
	}

	ssmsg := r.createStaticStateMsg()
	b, err = msgpack.Marshal(&ssmsg)
	if err != nil {
		return
	}
	err = c.send(b)
	if err != nil {
		log.Printf("error sending map to client %v", err)
		return
	}

	r.clients[c] = true

	// Populate chat messages
	for _, chatMsg := range r.chatQueue {
		b, err = msgpack.Marshal(&chatMsg)
		if err != nil {
			log.Printf("%v", err)
		}

		c.send(b)
	}

	go c.run()
}

func (c *Client) run() {
	defer func() {
		c.room.unregister <- c
		c.ws.Close()
	}()

	for {
		_, b, err := c.ws.ReadMessage()

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("unexpected socket error: %v", err)
			}
			return
		}

		log.Printf("Received bytes: %v", string(b))

		imsg := IncomingMsg{
			b: b,
			client: c,
		}
		c.room.incoming <- imsg
	}
}

func (c *Client) setState() {
	if c.keys[upKey] {
		c.pd.Acc.Y = upAcc
	} else if c.keys[downKey] {
		c.pd.Acc.Y = downAcc
	} else {
		c.pd.Acc.Y = 0
	}

	if c.keys[leftKey] {
		c.pd.Acc.X = leftAcc
	} else if c.keys[rightKey] {
		c.pd.Acc.X = rightAcc
	} else {
		c.pd.Acc.X = 0
	}
}

func (c *Client) updateState() {
	c.pd.Vel.add(c.pd.Acc, frame)
	if dot(c.pd.Vel, c.pd.Acc) <= 0 {
		c.pd.Vel.scale(friction)
	}

	if c.pd.Acc.isZero() && c.pd.Vel.lenSquared() <= minStopSpeedSquared {
		c.pd.Vel.scale(0)
	}

	c.pd.Vel.clamp(maxHorizontalVel, maxVerticalVel)
	c.pd.Pos.add(c.pd.Vel, frame)
}