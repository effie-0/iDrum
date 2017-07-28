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
	
files = getDirectory("./Songs")
for file in files:
	if file != "directory.js" and file != ".DS_Store" and file != "directory.txt":
		getDirectory("./Songs/" + file)