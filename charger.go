package main

import (
	"math"
	"time"
)

type Charger struct {
	juice int
	maxJuice int
	reversed bool
	charger Timer
}

func NewCharger(juice int, chargeTime time.Duration) Charger {
	if juice == 0 {
		panic("made a charger with 0 juice")
	}

	return Charger {
		juice: juice,
		maxJuice: juice,
		charger: NewTimer(chargeTime),
	}	
}

func NewReverseCharger(juice int, chargeTime time.Duration) Charger {
	c := NewCharger(juice, chargeTime)
	c.juice = 0
	c.reversed = true
	return c
}

func (c Charger) GetJuice() uint8 {
	c.refill()
	return uint8(c.juice)
}

func (c Charger) GetPercent() uint8 {
	c.refill()
	return uint8(c.juice / c.maxJuice)
}

func (c *Charger) SetDelay(delay time.Duration) {
	c.charger.SetDelay(delay)
}

func (c *Charger) SetJuice(juice int) {
	c.juice = juice
	c.charger.Start()
}

func (c *Charger) UseJuice(juice int) {
	c.refill()

	if c.reversed {
		juice = -juice
	}

	c.juice -= juice
	c.cap()
	c.charger.Start()
}

func (c *Charger) refill() {
	juice := int(math.Round(c.charger.Lerp(0, float64(c.maxJuice))))

	if c.reversed {
		juice = -juice
	}
	c.juice += juice
	c.cap()
}

func (c *Charger) use(juice int) {

}

func (c *Charger) cap() {
	if c.juice < 0 {
		c.juice = 0
	} else if c.juice > 100 {
		c.juice = 100
	}
}