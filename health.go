package main

import (
	"time"
)

const (
	maxDamageTicks int = 10
	lastDamageTime time.Duration = 10 * time.Second
)

type DamageTick struct {
	sid SpacedId
	damage int
	time time.Time
}

type Health struct {
	enabled bool
	health int
	ticks []DamageTick
}

func NewHealth() Health {
	return Health {
		enabled: false,
		health: 0,
	}
}

func (h *Health) Respawn() {
	h.ticks = make([]DamageTick, 0)
}

func (h *Health) Die() {
	h.SetHealth(0)
}

func (h *Health) SetHealth(health int) {
	h.enabled = true
	h.health = health
}

func (h Health) GetHealth() int {
	return h.health
}

func (h Health) Dead() bool {
	if isWasm || !h.enabled {
		return false
	}
	return h.health <= 0
}

func (h Health) GetLastTicks(duration time.Duration) []DamageTick {
	currentTime := time.Now()
	for i, tick := range(h.ticks) {
		if currentTime.Sub(tick.time) <= duration {
			return h.ticks[i:]
		}
	}
	return make([]DamageTick, 0)
}

func (h Health) GetLastDamageId(duration time.Duration) SpacedId {
	if len(h.ticks) == 0 {
		return InvalidId()
	}

	tick := h.ticks[len(h.ticks)-1]

	if time.Now().Sub(tick.time) <= duration {
		return tick.sid
	}
	return InvalidId()
}

func (h *Health) TakeDamage(sid SpacedId, damage int) {
	if !h.enabled || h.Dead() || isWasm || damage == 0 {
		return
	}
	h.SetHealth(h.health - damage)

	tick := DamageTick {
		sid: sid,
		damage: damage,
		time: time.Now(),
	}
	h.ticks = append(h.ticks, tick)

	if len(h.ticks) > maxDamageTicks {
		h.ticks = h.ticks[1 : maxDamageTicks + 1]
	}
}