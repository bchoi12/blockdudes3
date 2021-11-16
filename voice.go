package main

func (r *Room) forwardVoiceMessage(msgType MessageType, c *Client, msg JSONPeerMsg) error {
	outMsg := JSONPeerMsg {
		T: msgType,
		From: c.id,
		To: msg.To,
		JSON: msg.JSON,
	}

	id := msg.To
	client := r.clients[msg.To]

	if !client.voice || c.id == id {
		return nil
	}

	return client.send(&outMsg)
}

func (r *Room) joinVoice(c *Client) error {
	c.voice = true
	msg := r.createClientMsg(joinVoiceType, c, true)
	r.send(&msg)
	return nil
}

func (r *Room) leaveVoice(c *Client) error {
	c.voice = false
	msg := r.createClientMsg(leftVoiceType, c, true)
	r.send(&msg)
	return nil
}