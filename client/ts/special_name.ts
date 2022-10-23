
import { Util } from './util.js'

export interface SpecialName {
	text : string;
	color? : string;
}

export class SpecialNames {
	constructor() {}

	static goal() : SpecialName {
		return {
			text: "exit portal",
			color: Util.colorString(vipColor),
		}
	}

	static vip() : SpecialName {
		return {
			text: "VIP",
			color: Util.colorString(vipColor),
		}
	}
}
