RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' #No color
function extra_setup_mac {
  if ( python --version | grep -v -q "2.7" ); then
    echo "Python 2.7 not detected"
    while true; do
        read -p "Use easy_install to install Python 2.7?: " yn
        case $yn in
            [Yy]* ) echo "Attempting to install Python 2.7..."
              sudo easy_install setuptools
              sudo easy_install pyyaml; break;;
            [Nn]* ) break;;
            * ) echo "Please answer yes or no.";;
        esac
    done
  fi
}

function install_venv {
  echo "Checking for pip2"
  if ( which pip2 | grep -v -q "not found" ); then
    echo "Found pip2!"
  else
    echo "pip2 not found"
  fi
  while true; do
    read -p "Install pip automatically?: " yn
    case $yn in
        [Yy]* ) echo "Installing pip via get-pip.py..."
          curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
          break;;
        [Nn]* ) echo "See https://pip.pypa.io/en/stable/installing/ for instructions to install pip manually"
          exit;;
        * ) echo "Please answer yes or no.";;
    esac
  done
  
  echo "Installing virtual environment..."
  cd ~/opensource
  pip2 install virtualenv
  python2 -m virtualenv env
  echo "Entering virutal environment"
  source env/bin/activate
}

function setup_oppia {
  echo "Creating opensource folder if missing..."
  mkdir -p ~/opensource
  cd opensource
  while true; do
    read -p "Remove previous install if exists? " yn
    case $yn in
        [Yy]* ) rm -rf oppia* karma_coverage_reports; break;;
        [Nn]* ) break;;
        * ) echo "Please answer yes or no.";;
    esac
  done
  echo "Cloning oppia"
  while true; do
    read -p "Please enter your Github username or Oppia fork url: " name
    fork_url="https://github.com/$(git config github.user)/oppia.git"
    # Check if given url
    if ( git ls-remote $name | grep -q -v "Repository not found." ); then
      fork_url=$name
    fi
    # Check if fork exists for username
    if ( git ls-remote $fork_url | grep -q -v "Repository not found." )
    then
      git clone fork_url
    else
      echo "Couldn't find fork at: $fork_url\nPlease check that fork exists and/or username/url is correct"
    fi
  done
  echo "Cloning and setting remote upstream"
  git clone https://github.com/{$(git config github.user)}/oppia.git
  cd oppia
  git remote add upstream https://github.com/oppia/oppia.git

  echo "Installing prerequisites..."
  PS3='Pick an installation strategy?: '
  options=("easy-install (macOS)" "install_prerequisites.sh (Debian/Ubuntu only)" "apt-get" "Quit")
  select opt in "${options[@]}"
  do
    case $opt in
      "easy-install (macOS)")
        extra_setup_mac;;
      "install_prerequisites.sh (Debian/Ubuntu only)")
        echo "Running oppia/scripts/install_prerequisites.sh"
        bash scripts/install_prerequisites.sh;;
      "apt-get")
        echo ">sudo apt-get install curl python-setuptools git python-dev python-pip python-yaml"
        sudo apt-get install curl python-setuptools git python-dev python-pip python-yaml;;
      "Quit")
          break;;
      *) echo "invalid option: $REPLY";;
    esac
  done

  while true; do
    read -p "Install chromium-browser?: " yn
    case $yn in
        [Yy]* ) sudo apt-get update
          sudo apt-get install software-properties-common
          sudo add-apt-repository ppa:canonical-chromium-builds/stage
          sudo apt-get update
          sudo apt-get install chromium-browser; break;;
        [Nn]* ) break;;
        * ) echo "Please answer yes or no.";;
    esac
  done
  echo "As of December 2020 Oppia uses Python 2.7\nYou may want to use a virtual environment to avoid conflicts with existing python versions\nFor more information on virtual environments, see: https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/\nIf you are on macOS, this is a necessary step"
  while true; do
    read -p "Would you like to install a virtual environment?: "
    case $yn in
      [Yy]* ) install_venv; break ;;
      [Nn]* ) break ;;
      * ) echo "Please answer yes or no.";;
    esac
  done
  echo "If you completed these steps without any errors, you should have all necessary prerequisites\nThe remaining installation requires starting up the Oppia development server by running:\npython -m start.scripts\nThis will take a while the first time, but won't contain any more prompts."
}

# For more convenient scripts, I use these two commands in my .zshrc file (.bashrc equivalent)
# 
# oppdate() {
#     git fetch upstream
#     git merge upstream/develop
# }
# goppia() {
#     source ~/opensource/env/bin/activate # activate venv
#     cd ~/opensource/oppia
#     git checkout develop
#     oppdate
# }