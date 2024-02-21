# Usage: ./subdomaingrepper.sh <path_to_wildcard_file>
# Description: This script uses subfinder, findomain, assetfinder, amass, httpx, and nmap to enumerate subdomains, check for live domains, and check for open ports.
# Output: The script will create a file called subdomains that contains all the subdomains found, a file called httpxout that contains all the live domains found, and a file called nmapout that contains all the open ports found.

#!/bin/bash

LAGOON='\033[38;5;25m'
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

handle_error() {
    echo -e "${RED}Error: $1${RESET}"
    exit 1
}

execute_command() {
    local command="$1"
    local message="$2"
    echo -e "${GREEN}$message${RESET}"
    if ! output=$(eval "$command"); then
        handle_error "Failed to execute '$command'."
    fi
    echo -e "$output"
}

show_help() {
    echo "Usage: $0 [-h] <wildcard_file> <unique_name>"
    echo "Description: This script uses subfinder, findomain, assetfinder, amass, httpx, and nmap to enumerate subdomains, check for live domains, and check for open ports."
    echo "Options:"
    echo "  -h, --help         Show this help message and exit"
    echo "Arguments:"
    echo "  wildcard_file      Path to the wildcard file containing domain names"
    echo "  unique_name        Unique name to be used for naming the output files and folder"
    exit 0
}

if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    show_help
fi

# Check if the required number of arguments are provided
if [ $# -ne 2 ]; then
    handle_error "Incorrect number of arguments. Use -h option for help."
fi

wildcard_file="$1"
unique_name="$2"
output_folder="${unique_name}_output"

if [ ! -d "$output_folder" ]; then
    mkdir "$output_folder" || handle_error "Failed to create output folder."
fi

echo -e "${RED}   ______  _____  ___  ____  __  ______   _____  __  ________  _______  ___  _______ ${RESET}"
echo -e "${RED}  / __/ / / / _ )/ _ \/ __ \/  |/  / _ | /  _/ |/ / / ___/ _ \/ __/ _ \/ _ \/ __/ _ \ ${RESET}"
echo -e "${RED} _\ \/ /_/ / _  / // / /_/ / /|_/ / __ |_/ //    / / (_ / , _/ _// ___/ ___/ _// , _/ ${RESET}"
echo -e "${RED}/___/\____/____/____/\____/_/  /_/_/ |_/___/_/|_/  \___/_/|_/___/_/  /_/  /___/_/|_| ${RESET}"

echo -e "${LAGOON}\tSubdomain Enumeration Script By Zeeshan${RESET}\n\n"

# Execute commands with error handling
execute_command "subfinder -dL \"$wildcard_file\" -o \"$output_folder/subfinderout\"" "Using Subfinder to enumerate new domains...."
execute_command "findomain -f \"$wildcard_file\" -u \"$output_folder/findomainout\"" "Using Findomain to enumerate new domains...."
execute_command "cat \"$wildcard_file\" | assetfinder -subs-only  | anew \"$output_folder/assetfinderout\"" "Using Assetfinder to enumerate new domains...."
execute_command "amass enum -df \"$wildcard_file\" -o \"$output_folder/amassout\"" "Using Amass to enumerate new domains...."

# Combine subdomains
echo -e "${GREEN}Combining all the subdomains into one file....${RESET}"
execute_command "cat \"$output_folder/subfinderout\"" "" | anew "$output_folder/${unique_name}_subdomains"
execute_command "cat \"$output_folder/findomainout\"" "" | anew "$output_folder/${unique_name}_subdomains"
execute_command "cat \"$output_folder/assetfinderout\"" "" | anew "$output_folder/${unique_name}_subdomains"
execute_command "cat \"$output_folder/amassout\"" "" | anew "$output_folder/${unique_name}_subdomains"

# Check for live domains
execute_command "httpx -title -tech-detect -status-code -l \"$output_folder/${unique_name}_subdomains\" | anew \"$output_folder/${unique_name}_httpxout\"" "Using httpx to check for live domains...."

# Check for open ports
execute_command "smap -iL \"$output_folder/${unique_name}_subdomains\" | anew \"$output_folder/${unique_name}_nmapout\"" "Using Smap to check for open ports...."

echo -e "${GREEN}Output files are saved in the folder: ${output_folder}${RESET}"

# Clean up temporary files
rm "$output_folder/subfinderout" "$output_folder/findomainout" "$output_folder/assetfinderout" "$output_folder/amassout"
