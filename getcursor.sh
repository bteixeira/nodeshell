echo -ne "\033[6n"            # ask the terminal for the position
read -s -d\[ garbage          # discard the first part of the response
read -s -d R foo              # store the position in bash variable 'foo'
echo -n "Current position: "
echo "$foo"                   # print the position
