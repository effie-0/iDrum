import os
def getDirectory(path):
	directory = open(path + "/directory.js","w")
	fileList = os.listdir(path)
	directory.write("var directory = [")
	for file in fileList:
		directory.write("\"" + file + "\"" + "," +" ");
	directory.write("]")
	directory.close()
	return fileList

files = getDirectory("./")

for file in files:
	if file[-3] = "osu" :
		read_file = open(file, "r")
		write_file = open(file[0:-3] + "js", "w")
		write_file.write("var beatmap = [");
		for line in read_file:
			write_file.write("\"" + line + "\"" + ", ")
		write_file.write("]")
		read_file.close()
		write_file.close()