#!/bin/bash

svn export https://svn.spraakdata.gu.se/sb-arkiv/material/Makefile.rules --force
svn export https://svn.spraakdata.gu.se/sb-arkiv/material/Makefile.common --force

make
