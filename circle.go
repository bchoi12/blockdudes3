package main

import (
	"math"
)

type Circle struct {
	BaseProfile
}

func NewCircle(init Init) *Circle {
	return &Circle {
		BaseProfile: NewBaseProfile(init),
	}
}

func (c Circle) Radius() float64 {
	return c.Dim().X / 2
}

func (c Circle) RadiusSqr() float64 {
	return c.Radius() * c.Radius()
}

func (c Circle) Contains(point Vec2) ContainResults {
	results := c.BaseProfile.Contains(point)
	if results.contains {
		return results
	}

	result := NewContainResults()
	pos := c.Pos()
	distX := pos.X - point.X
	distY := pos.Y - point.Y
	result.contains = distX * distX + distY * distY <= c.RadiusSqr()
	
	results.Merge(result)
	return results
}

func (circ Circle) Intersects(line Line) IntersectResults {
	results := circ.BaseProfile.Intersects(line)

	d := line.Ray()
	f := line.Origin()
	f.Sub(circ.Pos(), 1.0)

	a := d.Dot(d)
	b := 2 * f.Dot(d)
	c := f.Dot(f) - circ.RadiusSqr()

	discriminant := b * b - 4 * a * c

	// No intersection
	if discriminant < 0 {
		return results
	}


	discriminant = math.Sqrt(discriminant)
	t1 := (-b - discriminant) / (2 * a)
  	if t1 >= 0 && t1 <= 1 {
		result := NewIntersectResults()
  		result.hit = true
  		result.t = t1
  		result.tmax = t1
  		results.Merge(result)
  	}

  	t2 := (-b + discriminant) / (2 * a)
  	if t2 >= 0 && t2 <= 1 {
	  	result := NewIntersectResults()
		result.hit = true
  		result.t = t2
  		result.tmax = t2
  		results.Merge(result)
  	}
	return results
}

func (c Circle) OverlapProfile(profile Profile) CollideResult {
	results := c.BaseProfile.OverlapProfile(profile)

	result := NewCollideResult()
	switch other := profile.(type) {
	case *RotPoly:
		result.Merge(other.OverlapProfile(&c))
	case *Rec2:
		result.Merge(other.OverlapProfile(&c))
	case *Circle:
		offset := c.Offset(other)
		radius := c.Radius() + other.Radius()
		if offset.LenSquared() <= radius * radius {
			result.SetHit(true)

			posAdj := offset
			posAdj.Normalize()
			posAdj.Scale(radius)
			posAdj.Sub(offset, 1.0)
			result.SetPosAdjustment(posAdj)
		}
	}

	results.Merge(result)
	return results
}