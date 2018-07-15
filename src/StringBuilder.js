export class StringBuilder{
	constructor(str){
		str = (typeof str !== 'undefined') ? str.toString() : '';
		this._string = str;
	}
	get Length(){
		return this._string.length;
	}
	Append(str){
		this._string += str;
	}
	AppendLine(str){
		if (typeof str !== 'undefined') this.Append(str);
		this._string += "\n";
	}
	AppendFormat(format){
		//taken from http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
		var args = Array.prototype.slice.call(arguments, 1);
		this._string += format.replace(/{(\d+)}/g, function(match, number){
			return typeof args[number] != 'undefined' ? args[number] : match;
		});
	}
	toString(){
		return this._string;
	}
}