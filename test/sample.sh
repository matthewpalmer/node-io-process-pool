while read line
do
	sleep $1 # Long running operation
	line="$line $line"
	echo "$line"
done < "/dev/stdin"
