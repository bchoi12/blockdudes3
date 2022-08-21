package main

type InitProps struct {
	props PropMap
}

func NewInitProps() InitProps {
	return InitProps {
		props: make(PropMap),
	}
}

func (ip* InitProps) SetInitProp(prop Prop, value interface{}) {
	ip.props[prop] = value
}

func (ip InitProps) GetInitData() Data {
	data := NewData()

	for prop, value := range(ip.props) {
		data.Set(prop, value)
	}

	return data
}