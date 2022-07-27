package main

import (
	"time"
)


type Timer struct {
	started time.Time
	duration time.Duration
}

func NewTimer(duration time.Duration) Timer {
	return Timer {
		started: time.Time{},
		duration: duration,
	}
}

func (t *Timer) SetDuration(duration time.Duration) {
	t.duration = duration
}

func (t *Timer) Start() {
	t.started = time.Now()
}

func (t *Timer) On() bool {
	return time.Now().Sub(t.started) <= t.duration
}

func (t Timer) Lerp(min float64, max float64) float64 {
	ts := float64(time.Now().Sub(t.started) / t.duration)

	return min + ts * (max - min)
}