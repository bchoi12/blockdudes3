package main

import (
	"time"
)

type ExpirationMode uint8
const (
	unknownExpirationMode ExpirationMode = iota
	constantExpirationMode
	variableExpirationMode
)

type Expiration struct {
	mode ExpirationMode
	startTime time.Time
	ttl time.Duration

	frames float64
}

func NewExpiration() Expiration {
	return Expiration {
		mode: unknownExpirationMode,
		startTime: time.Time{},
		ttl: 0,
		frames: 0,
	}
}

func (e *Expiration) SetConstantTTL(ttl time.Duration) {
	e.mode = constantExpirationMode

	e.startTime = time.Now()
	e.ttl = ttl
}

func (e *Expiration) SetVariableTTL(ttl time.Duration) {
	e.mode = variableExpirationMode

	e.frames = float64(ttl / frameTime)
}

func (e *Expiration) RemoveTTL() {
	e.mode = unknownExpirationMode
}

func (e Expiration) Expired() bool {
	if isWasm {
		return false
	}

	if e.mode == constantExpirationMode {
		return time.Now().Sub(e.startTime) >= e.ttl
	}

	if e.mode == variableExpirationMode {
		return e.frames <= 0
	}

	return false
}

func (e *Expiration) PostUpdate(updateSpeed float64) {
	if e.mode == variableExpirationMode {
		e.frames -= updateSpeed
	}
}