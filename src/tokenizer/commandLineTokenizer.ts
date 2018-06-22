import {Tape} from '../tape';

import * as jsMatcher from './matchers/jsMatcher';
import * as redirMatcher from './matchers/redirMatcher';
import * as dQStringMatcher from './matchers/dqStringMatcher';
import * as chainMatcher from './matchers/chainMatcher';
import * as globMatcher from './matchers/globMatcher';

export default function (line) {
    const tape = new Tape(line);

    var c, tokens = [];
    var token;

    while (tape.hasMore()) {
        c = tape.peek();
        if (/^\s$/.test(c)) {
            tape.next();
            continue;
        } else if (c === '"') {
            token = dQStringMatcher.run(tape);

            //continue;
        } else if (c === '(') {
            token = jsMatcher.run(tape);
            //tokens.push(token);
            //continue;
        } else if (c === '|' || c === '&') {
            token = chainMatcher.run(tape);
            //tokens.push(token);
            //continue;
        } else if (c === '>' || c === '<' || /^\d$/.test(c)) {
            tape.setMark();
            tape.pushMark();
            token = redirMatcher.run(tape);
            if (token.type === redirMatcher.tokens.NOTREDIR) {
                tape.popMark();
                tape.rewindToMark();
                //matcher = new GlobMatcher(tape);
                token = globMatcher.run(tape);
                //tokens.push(token);
            } //else {
                // the mark is in the stack, forever...
                //tokens.push(token);
                //continue;
            //}
        } else {
            //matcher = new GlobMatcher(tape);
            token = globMatcher.run(tape);
            //tokens.push(token);
            //continue;
        }

        tokens.push(token);
        if (token.type === 'COMPLETION') {
            break
        }
        //token = matcher.run();
//        console.log('got a token ' + t.type + ': ' + t.text);
//        tokens.push(token);
    }

    return tokens;
};
