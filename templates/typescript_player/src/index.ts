import { Story } from 'inkjs';
import intercept from "./story.json";

const s = new Story(intercept)

let text = s.Continue()

console.log(text)
