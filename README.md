## Introducing Subdomain Grepper:
Your go-to tool for finding and checking subdomains. It combines different tools to give you a clear picture of a website's subdomains, including any potential security risks by detecting technology used. By scanning for open ports and checking status codes, it helps you understand which subdomains are active and secure. Plus, it makes sure you don't get bogged down by repeating information. Say goodbye to complicated searches and hello to easy, efficient subdomain analysis with Subdomain Grepper!

## Tools you need to install before using it:
* Amass: https://github.com/owasp-amass/amass
* Subfinder: https://github.com/projectdiscovery/subfinder
* Findomain: https://github.com/Findomain/Findomain
* Assetfinder: https://github.com/tomnomnom/assetfinder
* Anew: https://github.com/tomnomnom/anew
* Httpx: https://github.com/projectdiscovery/httpx
* Smap: https://github.com/s0md3v/Smap

## How to use:
* Clone this repo.
```
Run bash install.sh
```
* Now you can use the tool like this:
```
subgrep [-h] <wildcard_file> <unique_name>
```

* **Example Wildcard File:**<br>
Create a wildcard file with no extension. Just "wildcard" - no .txt etc. In that file add the domains for example ```facebook.com, meta.com```.
![image](https://github.com/itszeeshan/Subdomain-Grepper/assets/35112049/21b6612f-0ecc-493f-88cf-b12b312d317a)


### Output Files:
The script will create a file called subdomains that contains all the subdomains found, a file called httpxout that contains all the live domains found, and a file called nmapout that contains all the open ports found.
**Filenames are:**
1. subdomains (all unique subdomains)
2. nmapout (with port scanning information)
3. httpxout (with status code, page title, and techdetected)
