package main

import (
	"github.com/vmihailenco/msgpack/v5"
	"math"
	"time"
)

func Pack(msg interface{}) []byte {
	b, err := msgpack.Marshal(msg)
	if err != nil {
		panic(err)
	}
	return b
}

func Unpack(b []byte, msg interface{}) error {
	err := msgpack.Unmarshal(b, msg)
	if err != nil {
		return err
	}
	return nil
}

func GetTimestep(now time.Time, lastTime time.Time) float64 {
	var timeStep time.Duration
	if lastTime.IsZero() {
		timeStep = 0
	} else {
		timeStep = now.Sub(lastTime)
	}
	return float64(timeStep) / float64(time.Second)
}

func NormalizeAngle(rad float64) float64 {
	if rad >= 0 && rad < 2 * math.Pi {
		return rad
	}

	return rad - float64(IntDown(rad / (2 * math.Pi))) * 2.0 * math.Pi
}

func Mod(a, b int) int {
    return (a % b + b) % b
}

func Max(a, b float64) float64 {
	if a > b {
		return a
	} 
	return b
}

func AbsMax(a, b float64) float64 {
	if Abs(a) > Abs(b) {
		return a
	}
	return b
}

func Min(a, b float64) float64 {
	if a < b {
		return a
	} 
	return b
}

func AbsMin(a, b float64) float64 {
	if Abs(a) < Abs(b) {
		return a
	}
	return b
}

// Round down when positive and negative
func IntDown(n float64) int {
	if n < 0 {
		return int(n-1)
	}
	return int(n)
}

// Round up when positive and negative
func IntUp(n float64) int {
	if n < 0 {
		return int(n)
	}
	return int(n+1)
}

func Abs(n float64) float64 {
	if n < 0 {
		return -n
	}
	return n
}

func Sign(n float64) int {
	if n == 0 {
		return 0
	} else if n < 0 {
		return -1
	} else {
		return 1
	}
}

func SignPos(n float64) int {
	if n < 0 {
		return -1
	} else {
		return 1
	}
}

func FSign(n float64) float64 {
	if n == 0 {
		return 0
	} else if n < 0 {
		return -1
	} else {
		return 1
	}
}

func FSignPos(n float64) float64 {
	if n < 0 {
		return -1
	} else {
		return 1
	}
}

func Clamp(min, n, max float64) float64 {
	return Max(Min(min, n), max)
}

func And(bools ...bool) bool {
	for _, b := range(bools) {
		if !b {
			return false 
		}
	}
	return true
}

func Or(bools ...bool) bool {
	for _, b := range(bools) {
		if b {
			return true
		}
	}
	return false
}