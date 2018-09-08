export class DebugMetadata {
	public startLineNumber: number = 0;
	public endLineNumber: number = 0;
	public fileName: string | null = null;
	public sourceName: string | null = null;

	public toString() {
		if (this.fileName !== null) {
			return `line ${this.startLineNumber} of ${this.fileName}"`;
		} else {
			return 'line ' + this.startLineNumber;
		}
	}
}
