

# read file & load into list
my_list = []
with open("actions.txt", 'r') as my_file:
    while True:
        line = my_file.readline()
        if not line:
            break
        lst = line.split('\t')
        my_list.append([x.strip() for x in lst])

for item in my_list:
    print(item)
