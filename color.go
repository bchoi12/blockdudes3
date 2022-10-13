package main

const (
	archRed int = 0xfc1f0f
	archOrange int = 0xfc910f
	archYellow int = 0xfcf40f
	archGreen int = 0x0ffc89
	archBlue int = 0x0fdcfc
	archPurple int = 0x910ffc
	archWhite int = 0xffffff

	boltColor int = 0xffa610
	chargedBoltColor int = 0x10b3ff
	rocketExplosionColor int = 0xbb4444
	tableColor int = 0x996312

	starRed = 0xed0505
	starBlue = 0x020f9e
	starOrange = 0xed8805
	starDarkPurple = 0x5805ab
	starPurple = 0xc306d1
	starSecondary = 0xfbfbfb
)

var teamColors = map[uint8]int {
	0: 0x333333,
	1: 0xFF0000,
	2: 0x0000FF,
}