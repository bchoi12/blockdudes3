package main

import (
	"github.com/gorilla/websocket"
	"log"
)

type Client struct {
	room *Room
	ws *websocket.Conn
	id int
	name string
}

func (c *Client) send(data []byte) error {
	err := c.ws.WriteMessage(websocket.BinaryMessage, data)

	if err != nil {
		log.Printf("error writing out message: %v", err)
	}
	return err
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

		imsg := IncomingMsg{
			b: b,
			client: c,
		}
		c.room.incoming <- imsg
	}
}