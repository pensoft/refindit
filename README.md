# ReFindit #

ReFindit is a bibliographic references search engine that brings together information from different sources and builds services on top of the unified data.


![](https://raw.github.com/pensoft/refindit/master/client/i/refindit-architecture.png)


## Requirements ##

1. Node.js
2. Active internet connection

## Installation ##

1. Install <a href="http://nodejs.org/download/">Node.js</a>
2. `git clone http://github.com/pensoft/refindit && cd refindit`
3. `node app.js`
4. In your browser, go to [http://localhost:5000](http://localhost:5000)

## Data sources ##
ReFindit currently supports the following search types:

| Data source   | simple | advanced |
| :------------ |:------:| :-------:|
| [CrossRef](http://crossref.org/)             | ✔      |  ✔       |
| [PubMed](http://www.ncbi.nlm.nih.gov/pubmed)             | ✔      |  ✔       |
| [RefBank](http://refbank.org/)             | ✔      |  ✔       |
| [GNUB](http://www.globalnames.org/GNUB "Global Names Usage Bank") (incl. [ZooBank](http://zoobank.org/ "The Official Registry of Zoological Nomenclature"))             | ✔      |          |
| [BHL books](http://www.biodiversitylibrary.org/ "Biodiversity Heritage Library")             |        |  ✔       |
| [BHL items](http://www.biodiversitylibrary.org/ "Biodiversity Heritage Library")             |        |  ✔       |
| [Mendeley](http://www.mendeley.com/)             | ✔      |  ✔       |












<!-- 
## ReFindit services ##

The services are built with Node.js and Express. -->