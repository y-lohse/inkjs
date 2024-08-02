import { Story } from 'inkjs/types';
import intercept from "./story.json";

let story:Story = new Story(intercept);

let text = story.Continue()

let choices = story.currentChoices

console.log(text)
for (let c of  choices){
    console.log(` * ${c.text}`)
}