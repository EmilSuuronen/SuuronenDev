export const manuals: Record<string, string> = {
  help: "help [COMMAND]\nList commands, or show usage for one command. Try `man intro` for a tour.",
  intro:
    "SUURONEN DESKTOP — a browser shell\n\nThis Ubuntu-inspired shell runs entirely in your browser. It does not execute native Linux binaries, contact a server, or access your computer's files.\n\nGETTING AROUND\n  pwd                      Print the working directory\n  ls -lah                  Include hidden files and sizes\n  cd projects; cd ..        Navigate directories\n  cd -                     Return to the previous directory\n  cat about.txt            Read Emil's profile\n\nMAKE SOMETHING\n  mkdir -p projects/demo\n  printf 'hello\\nworld\\n' > projects/demo/hello.txt\n  cat projects/demo/hello.txt | grep world\n  nano projects/demo/hello.txt\n\nSHELL SYNTAX\nQuotes preserve spaces and case. Single quotes are literal; double quotes expand $USER, $HOME, $PWD and other variables. $? is the last exit status. Unquoted * and ? expand filenames; hidden files need a leading dot.\n\nUse | for pipelines, > to overwrite, >> to append, < for input, 2> for errors and 2>&1 to merge errors into output. Separate commands with ; or newlines. && runs after success; || runs after failure. # starts a comment. Aliases, environment assignments and history expansion (!!, !NUMBER, !prefix) are supported.\n\nThis is a subset of Bash: no scripts, command substitution, job control, package installation or native processes. Unsupported syntax and flags report an error.\n\nKEYBOARD\nUp/Down          Browse history; Down restores your draft\nTab              Complete a command, app, or path\nCtrl+R           Search history; repeat to find older matches\nCtrl+C           Cancel input or interrupt a running command\nCtrl+L           Clear the screen\nCtrl+A / Ctrl+E  Move to start / end\nCtrl+U / Ctrl+K  Cut before / after the cursor\nCtrl+W / Ctrl+Y  Cut previous word / paste cut text\nCtrl+D           Close an empty prompt\nShift+Tab        Move keyboard focus out of the input\n\nFILES AND PRIVACY\nYour virtual home directory and up to 500 history entries are saved in this browser's local storage. /tmp and shell variables last for this shell session. Files are limited to 128 KiB each and 1 MiB total. Do not put secrets in shell history; `history -c` clears it. Settings > Reset clears the site's stored data.\n\n~/Notes mirrors desktop Notes, read-only. `open Notes/name.txt` opens a note in the Notes app. Files you create elsewhere belong to the terminal sandbox.\n\nExplore `ls -a` for a few things that did not make it into the brochure.\n",
  ls: "ls [-alAhFR1dtr] [PATH...]\nList files. -a includes hidden files; -l gives details; -h formats sizes; -F marks directories; -R recurses; -t sorts by modification time; -r reverses order.",
  cd: "cd [DIRECTORY|-]\nChange directory. No argument returns home; - returns to the previous directory. Supports absolute paths, ~, . and ..",
  pwd: "pwd [-LP]\nPrint the current working directory. This filesystem has no symbolic links.",
  cat: "cat [-nb] [FILE...]\nRead files or piped/input-redirected text. -n numbers lines; -b numbers nonblank lines; - reads stdin.\nExample: cat about.txt stack.txt | head -n 5",
  tree: "tree [-ad] [DIRECTORY]\nPrint the directory tree. -a includes hidden entries; -d shows only directories.",
  find: "find [PATH] [-name PATTERN] [-type f|d]\nFind files recursively. Quote patterns to prevent the shell expanding them first.\nExample: find ~ -name '*.txt'",
  touch: "touch FILE...\nCreate empty files or update their modification time.",
  mkdir:
    "mkdir [-p] DIRECTORY...\nCreate directories; -p also creates missing parents.",
  rm: "rm [-rf] FILE...\nRemove virtual files. -r removes directories recursively; -f ignores missing files. System files and the home directory itself are protected.",
  rmdir: "rmdir DIRECTORY...\nRemove empty directories.",
  cp: "cp [-rn] SOURCE... DESTINATION\nCopy files; -r copies directories; -n skips existing destinations.",
  mv: "mv [-n] SOURCE... DESTINATION\nMove or rename files and directories; -n skips existing destinations.",
  stat: "stat FILE...\nShow file metadata.",
  du: "du [-sh] [PATH...]\nSummarize virtual file content sizes in KiB. -h uses readable units.",
  echo: "echo [-neE] [TEXT...]\nPrint text. -n omits the final newline; -e expands backslash escapes; -E leaves them literal.",
  printf:
    "printf FORMAT [ARGUMENT...]\nFormat text using %s, %d, %b, %% and backslash escapes.\nExample: printf '%s\\n' Python Go Kotlin | sort",
  head: "head [-n COUNT] [FILE...]\nPrint the first 10 lines, or COUNT lines. Reads stdin when no file is given.",
  tail: "tail [-n COUNT] [FILE...]\nPrint the last 10 lines, or COUNT lines. Reads stdin when no file is given.",
  grep: "grep [-invclFxq] PATTERN [FILE...]\nFilter lines. -i ignores case; -n numbers matches; -v inverts; -c counts; -l prints matching filenames; -F matches literal text; -x matches whole lines; -q sets status without output.\nSupports basic patterns: . * ^ $ [a-z] and escaped literals. Groups, backreferences and extended expressions are not supported. Matching uses a bounded-state engine.\nExample: cat stack.txt | grep -in 'python'",
  wc: "wc [-lwcm] [FILE...]\nCount newline characters, words, bytes, or Unicode characters. Default: lines, words, bytes.",
  sort: "sort [-nru] [FILE...]\nSort lines; -n sorts numerically, -r reverses, -u removes duplicates.",
  uniq: "uniq [-cdiu] [FILE]\nCollapse adjacent duplicates; -c counts, -d keeps repeated lines, -u keeps unique lines, -i ignores case.",
  cut: "cut -f FIELDS [-d DELIMITER] [FILE...]\ncut -c CHARACTERS [FILE...]\nSelect columns or characters. Lists support 1,3-5,7-. Default field delimiter is a tab.",
  tr: "tr [-ds] SET1 [SET2]\nTranslate characters from stdin; -d deletes, -s squeezes repeats. Supports ranges and [:lower:], [:upper:], [:digit:].\nExample: echo hello | tr 'a-z' 'A-Z'",
  rev: "rev [FILE...]\nReverse each line's characters.",
  base64:
    "base64 [-d] [FILE]\nEncode UTF-8 text; -d decodes. Reads stdin when no file is given.",
  seq: "seq [FIRST [INCREMENT]] LAST\nPrint a sequence of numbers, up to 10000 values.",
  nano: "nano FILE\nEdit a virtual file in the terminal. Ctrl+O saves; Ctrl+X exits; Escape cancels. Unsaved edits prompt before being discarded. System files and Notes are read-only.",
  less: "less [FILE...]\nRead text one page at a time. Space/PageDown moves forward; b/PageUp moves back; arrows scroll; g/G jumps; q/Escape exits. Also reads piped text.",
  more: "more [FILE...]\nPage through text; the same keys as less are available.",
  clear:
    "clear\nClear the screen without changing files, history or the working directory.",
  reset:
    "reset\nClear the screen and restore the startup banner. Files and history are preserved.",
  history:
    "history [COUNT|-c]\nShow saved command history. -c clears it. !! repeats the last command; !NUMBER and !prefix recall a command.",
  alias:
    "alias [NAME='COMMAND'...]\nList or define single-command aliases (no pipelines or command lists). Defaults: ll='ls -al', la='ls -a', l='ls'. Aliases last for this shell session.",
  unalias: "unalias NAME...\nRemove aliases.",
  env: "env\nPrint shell environment variables.",
  printenv: "printenv [NAME...]\nPrint all or selected environment variables.",
  export:
    "export [NAME=VALUE...]\nSet environment variables for this shell. HOME, USER, PWD and SHELL describe the virtual session.",
  unset: "unset NAME...\nRemove environment variables.",
  whoami: "whoami\nPrint the current virtual user.",
  id: "id [-un]\nPrint the virtual user's identity; -un prints the name; -u prints the numeric uid.",
  hostname: "hostname\nPrint this virtual desktop's host name.",
  uname:
    "uname [-asnrvm]\nPrint virtual system information. This is a browser sandbox, not a native Linux kernel.",
  date: "date [-I|--iso-8601|+FORMAT]\nPrint the browser's local time. Formats: %Y %m %d %H %M %S %F %T %s %%.",
  uptime: "uptime\nPrint time since this shell session started.",
  ps: "ps [-e|-ef|aux]\nList currently open desktop apps as virtual processes.",
  sleep:
    "sleep SECONDS\nWait for 0–3600 seconds. Ctrl+C interrupts immediately.",
  type: "type COMMAND...\nDescribe a command or alias.",
  which: "which COMMAND...\nPrint virtual command paths.",
  true: "true\nReturn success (status 0).",
  false: "false\nReturn failure (status 1).",
  test: "test EXPRESSION\n[ EXPRESSION ]\nTest -e/-f/-d PATH, -n/-z TEXT, TEXT =/!= TEXT, or integer -eq/-ne/-lt/-le/-gt/-ge comparisons. Use ! to negate.",
  exit: "exit [STATUS]\nClose the terminal window. Files and history remain saved. `logout` also closes it.",
  logout: "logout\nClose the terminal window.",
  apps: "apps\nList desktop applications. Launch one using `open NAME`.",
  open: "open APP|FILE|URL\nLaunch browser, calculator, settings, notes, terminal, antgame, code, molkkis, applications or trash. Open a .desktop launcher, a desktop Note, or read a virtual file in the pager. HTTPS links open in a new browser tab.\nExamples: open antgame; open Notes/todo.txt; open https://github.com/EmilSuuronen",
  reboot: "reboot\nRestart the desktop and replay the boot sequence. Your files, notes and windows stay as they are.",
  code: "code [FILE]\nOpen the Source Code app, optionally at a file of this desktop's source. FILE is matched loosely, so a partial name works.\nExamples: code; code Taskbar; code src/App.tsx",
  "xdg-open": "xdg-open APP|FILE|URL\nAlias for the desktop's open command.",
  notes:
    "notes\nList desktop Notes. Read with cat ~/Notes/NAME, or edit using open ~/Notes/NAME.",
  contact:
    "contact\nShow Emil's contact links. Can be piped or redirected as plain text.",
  logo: "logo\nShow the original SuuronenDev startup banner.",
  neofetch: "neofetch\nShow information about this browser desktop session.",
  fortune: "fortune\nA small piece of developer wisdom.",
  cowsay:
    "cowsay [TEXT...]\nLet a cow deliver your message. Also accepts piped text.",
  coffee: "coffee\nTake a Finnish coffee break.",
  sl: "sl\nYou probably meant ls. Your train has arrived anyway.",
  adventure:
    "adventure [look|north|south|east|west|take ITEM|use ITEM|inventory|reset]\nA small text adventure inside the desktop. Find the source of the mysterious fan noise.",
  ants: "ants\nThe bug report has legs.",
  sudo: "sudo COMMAND\nThis virtual user has no elevated privileges. Perhaps ask for lunch instead.",
  apt: "apt moo\nPackage installation requires a real Ubuntu machine. The cow is available offline.",
  man: "man COMMAND\nRead a command's manual. Space scrolls; q exits. `man intro` explains the shell.",
};

export function helpText(command?: string) {
  if (command)
    return Object.prototype.hasOwnProperty.call(manuals, command)
      ? `${manuals[command]}\n`
      : null;
  return "Available commands (help COMMAND for usage, man intro for a tour):\n\nFiles       ls  cd  pwd  tree  find  cat  stat  du\nCreate      mkdir  touch  cp  mv  rm  rmdir  nano\nText        echo  printf  head  tail  grep  wc  sort  uniq\n            cut  tr  rev  base64  seq  less  more\nShell       history  alias  unalias  env  printenv  export\n            unset  type  which  test  true  false  sleep\nSystem      whoami  id  hostname  uname  date  uptime  ps\nDesktop     apps  open  xdg-open  code  notes  contact  neofetch\nSession     clear  reset  logo  reboot  exit  logout\nDiscover    fortune  cowsay  coffee  adventure\n\nUse pipes (|), redirects (> >> <), quotes, variables, && and ||.\nTab completes; Up/Down recalls; Ctrl+R searches; Ctrl+C cancels.\nHome files and history are saved in this browser. Try ls -a.\n";
}
