nodeshell
=========

What do you do when you get tired of your shell?  
That's right, you make your own.

**Current Status:** Almost stable. Some features missing or poorly implemented.

This project was born out of some disappointment with the customization possibilities of nowadays shells.  
Shells like Bash and Zshell work quite well and are armed with a bunch of features, but they are really hard to customize if you're not up for reading epic size documentation and learn all the quirks and corner cases of weird mini-languages created haphazardly for a single purpose.
<!--After reading the whole User Guide on Zsh, I still felt like I didn't really know how to start making my own customization if I wasn't willing to just accept what Oh-My-Zsh provides out of the box.-->

<!--What I want is a shell that I can customize using a single imperative language instead of learning a handful of declarative langlets and three different languages for regular expression.
I want a shell that lets me evaluate normal expressions in my favorite language while still accepting known commands like "cd .."
I want a shell that exposes an API in Javascript and then just lets me do whatever I want. If the user already knows Javascript, they already know how to customize the shell.-->

<!--...and as far as I know, there isn't such a thing.

So I guess it's up to me.-->

<!--We'll start simple and just have a command line that takes usual commands as well as inline JS.
Then we'll go crazy.-->

How to get it and run it
------------------------

```
git clone https://github.com/bteixeira/nodeshell.git && cd nodeshell
npm install
node shell
```

That should take you to a command line.  
Here you can do the following:

1. Write valid Javascript expressions to be evaluated; or
2. Write a command followed by arguments. Arguments can be:
    1. Literal arguments as you do in any other shell (e.g., `git clone` or `cd nodeshell`); or
    2. Javascript expressions in parentheses

Try it out!

```
$ var getDir = function () {return 'nodeshell';}
undefined

$ cd ..
undefined

$ cd (getDir())
undefined

$ ls
LICENSE  node_modules  package.json  proto  README.md  shell.js  src  test  TODO.txt
0
```

What else does it do?
---------------------
If a file named `.nsh.js` exists in your home directory, it will be executed on startup.  
If a file with the same name exists in the local directory, it will be executed after that.

To change the text used as prompt, call `NSH.lineReader.setPrompt()`. If the argument you pass is a
function, it will be executed (synchronously -- be careful with loops!) every time the prompt has to be shown, and its return value
used for the prompt. If you assign any other value, that value will be converted to a string and used as the
prompt.

A sample `.nsh.js` file is included which sets up a prompt with a little more information than the default.

Other features common in shells are also already implemented, like expanding `~` to your home directory and command
history (with up and down keys).

Current Issues
--------------

**Need to define:**
* Global API (objects and methods available)
* Built-ins

**Rewrite:**

A couple of pieces are still remnants of the first prototype I made and have to be rewritten (not even refactored):

* CommandSet (commands.js)
* KeyHandler
* Line
