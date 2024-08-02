import { Story } from 'inkjs';
import intercept from "./story.json";

let story = new Story(intercept);

let text = story.Continue()

console.log(text)
