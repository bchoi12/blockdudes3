package main

import (
	"time"
)


type Timer struct {
	started time.Time
	delay time.Duration
	duration time.Duration
}

func NewTimer(duration time.Duration) Timer {
	return Timer {
		started: time.Time{},
		delay: 0,
		duration: duration,
	}
}

func (t *Timer) SetDelay(delay time.Duration) {
	t.delay = delay
}

func (t *Timer) SetDuration(duration time.Duration) {
	t.duration = duration
}

func (t *Timer) Start() {
	t.started = time.Now()
}

func (t Timer) On() bool {
	elapsed := t.Elapsed()
	return 0 <= elapsed && elapsed < t.duration
}

func (t Timer) Elapsed() time.Duration {
	elapsed := time.Now().Sub(t.started.Add(t.delay))

	if elapsed < 0 {
		return 0
	}
	return elapsed
}


func (t Timer) Lerp(min float64, max float64) float64 {
	ts := float64(t.Elapsed() / t.duration)

	return min + ts * (max - min)
}