package main

import (
	"time"
)

type Expiration struct {
	enabled bool
	startTime time.Time
	ttl time.Duration
}

func NewExpiration() Expiration {
	return Expiration {
		enabled: false,
		startTime: time.Time{},
		ttl: 0,
	}
}

func (e *Expiration) SetTTL(ttl time.Duration) {
	e.startTime = time.Now()
	e.enabled = true
	e.ttl = ttl
}

func (e *Expiration) RemoveTTL() {
	e.enabled = false
}

func (e Expiration) Expired() bool {
	if !e.enabled || isWasm {
		return false
	}
	return time.Now().Sub(e.startTime) >= e.ttl
}