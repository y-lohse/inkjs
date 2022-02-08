import { DebugMetadata } from "../../../engine/DebugMetadata";

export class Identifier {
    public name: string;
    public debugMetadata: DebugMetadata|null = null;

    get toString(): string{
        return this.name || 'undefined identifer';
    }

    constructor(name: string){
        this.name = name;
    }

    public static Done() : Identifier{
        return new Identifier("DONE");
    }
}