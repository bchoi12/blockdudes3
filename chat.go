package main

import (
	"strings"
)

const (
	maxChatMsgs int = 16
	maxChatMsgLength int = 256
)

type Chat struct {
	chatQueue []ChatMsg
	replacer *strings.Replacer
}

func newChat() *Chat {
	replacer := strings.NewReplacer(
	    "\r\n", "",
	    "\r", "",
	    "\n", "",
	    "\v", "",
	    "\f", "",
	    "\u0085", "",
	    "\u2028", "",
	    "\u2029", "",
	)

	return &Chat {
		chatQueue: make([]ChatMsg, 0),
		replacer: replacer,
	}
}

func (c *Chat) processChatMsg(client *Client, msg ChatMsg) ChatMsg {
	newMsg := c.replacer.Replace(msg.M)
	if len(newMsg) > maxChatMsgLength {
		newMsg = newMsg[:maxChatMsgLength]
	}

	outMsg := ChatMsg {
		T: chatType,
		Id: client.id,
		M: newMsg,
	}
	c.addChatMsg(outMsg)
	return outMsg
}

func (c *Chat) addChatMsg(msg ChatMsg) {
	c.chatQueue = append(c.chatQueue, msg)
	if (len(c.chatQueue) > maxChatMsgs) {
		c.chatQueue = c.chatQueue[1:maxChatMsgs + 1]
	}
}