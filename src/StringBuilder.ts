export class StringBuilder{

	private string: string;

	constructor(str: string){
		str = (typeof str !== 'undefined') ? str.toString() : '';
		this.string = str;
	}
	get Length(): number{
		return this.string.length;
	}
	public Append(str: string){
		this.string += str;
	}
	public AppendLine(str: string){
		if (typeof str !== 'undefined') this.Append(str);
		this.string += '\n';
	}
	public AppendFormat(format: string){
		// taken from http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
		const args = Array.prototype.slice.call(arguments, 1);
		this.string += format.replace(/{(\d+)}/g, (match: string, num: number) => {
			return typeof args[num] != 'undefined' ? args[num] : match;
		});
	}
	public toString(): string{
		return this.string;
	}
}
