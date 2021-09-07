package main

import (
	"github.com/gorilla/websocket"
	"github.com/vmihailenco/msgpack/v5"
	"log"
)

const (
	upAcc float64 = 16.0
	downAcc float64 = -upAcc
	maxVerticalVel = 4.0

	leftAcc float64 = -16.0
	rightAcc float64 = -leftAcc
	maxHorizontalVel = 4.0

	minStopSpeedSquared float64 = 0.2 * 0.2

	friction = 0.15
)

type Client struct {
	room *Room
	ws *websocket.Conn

	pd PData
	id int
	keys map[int]bool
}

type PData struct {
	Id int
	Pos Vec2
	Vel Vec2
	Acc Vec2
}

func (c *Client) send(data []byte) {
	err := c.ws.WriteMessage(websocket.BinaryMessage, data)
	if err != nil {
		log.Printf("error writing out message: %v", err)
	}
}

func (c* Client) init(r *Room) {
	r.clients[c] = true

	imsg := InitMsg{
		T: initType,
		Id: c.id,
		Ids: make([]int, 0),
	}
	for client := range r.clients {
		imsg.Ids = append(imsg.Ids, client.id)
	}

	b, err := msgpack.Marshal(&imsg)
	if err != nil {
		log.Printf("%v", err)
	}
	c.send(b)

	c.pd.Id = c.id
	c.pd.Pos.X = float64(c.id)

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
			if e, ok := err.(*websocket.CloseError); ok {
				switch e.Code {
					case websocket.CloseNormalClosure,
					websocket.CloseGoingAway,
					websocket.CloseNoStatusReceived:
						log.Printf("lost connection: %v", err)
						return
				}
			}

			log.Printf("error reading incoming message: %v", err)
			continue
		}

		log.Printf("Received bytes: %v", string(b))

		cmsg := ClientMsg{
			b: b,
			client: c,
		}
		c.room.incoming <- cmsg
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