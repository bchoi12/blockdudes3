package main

type RotRec2 struct {
	BaseProfile
}

func RotRec2ProfileOptions() ProfileOptions {
	return ProfileOptions {
		solid: false,
	}
}