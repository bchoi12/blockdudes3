package main

import (
	"time"
)


type Timer struct {
	started bool
	startTime time.Time
	delay time.Duration
	duration time.Duration
}

func NewTimer(duration time.Duration) Timer {
	return Timer {
		started: false,
		startTime: time.Time{},
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
	t.startTime = time.Now()
	t.started = true
}

func (t *Timer) Stop() {
	t.started = false
}

func (t Timer) Started() bool {
	return t.started
}

func (t Timer) On() bool {
	if !t.started {
		return false
	}

	elapsed := t.Elapsed()
	return 0 <= elapsed && elapsed <= t.duration
}

func (t Timer) Finished() bool {
	if !t.started {
		return false
	}

	return t.Elapsed() > t.duration
}

func (t Timer) Elapsed() time.Duration {
	if !t.started {
		return 0
	}

	elapsed := time.Now().Sub(t.startTime.Add(t.delay))
	return elapsed
}


func (t Timer) Lerp(min float64, max float64) float64 {
	if !t.started {
		return min
	}

	ts := Max(float64(t.Elapsed()), 0) / float64(t.duration)

	return min + ts * (max - min)
}