import {Path} from './Path';
import {Thread} from './CallStack';
import {throwNullException} from './NullException';

export class Choice{
	public text: string = '';
	public index: number = 0;
	public threadAtGeneration: Thread | null = null;
	public sourcePath: string = '';
	public targetPath: Path | null = null;
	public isInvisibleDefault: boolean = false;
	public _originalThreadIndex: number = 0;

	get pathStringOnChoice(): string{
		if (this.targetPath === null) return throwNullException('Choice.targetPath');
		return this.targetPath.toString();
	}
  set pathStringOnChoice(value: string){
		this.targetPath = new Path(value);
	}
}
