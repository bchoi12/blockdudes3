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

func (c *Client) joinVoice(r *Room) error {
	msg := r.createClientMsg(joinVoiceType, c, true)
	r.send(&msg)
	c.voice = true
	return nil
}

func (c *Client) leaveVoice(r *Room) error {
	msg := r.createClientMsg(leftVoiceType, c, true)
	r.send(&msg)
	c.voice = false
	return nil
}