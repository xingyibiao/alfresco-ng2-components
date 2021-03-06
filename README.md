# ALFRESCO ANGULAR COMPONENTS

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d9eb873741da403bb3284778102372e7)](https://www.codacy.com/app/Alfresco/alfresco-ng2-components?utm_source=github.com&utm_medium=referral&utm_content=Alfresco/alfresco-ng2-components&utm_campaign=badger)
[![Join the chat at https://gitter.im/Alfresco/alfresco-ng2-components](https://badges.gitter.im/Alfresco/alfresco-ng2-components.svg)](https://gitter.im/Alfresco/alfresco-ng2-components?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

<p>
  <a title='Build Status Travis' href="https://travis-ci.org/Alfresco/alfresco-ng2-components">
    <img src='https://travis-ci.org/Alfresco/alfresco-ng2-components.svg?branch=master'  alt='travis
    Status' />
  </a>
  <a title='Build Status AppVeyor' href="https://ci.appveyor.com/project/alfresco/alfresco-ng2-components">
    <img src='https://ci.appveyor.com/api/projects/status/github/Alfresco/alfresco-ng2-components'  alt='travis
    Status' />
  </a>
  <a href='https://codecov.io/gh/Alfresco/alfresco-ng2-components'>
    <img src='http://img.shields.io/codecov/c/github/Alfresco/alfresco-ng2-components/master.svg?maxAge=2592000' alt='Coverage Status' />
  </a>
  <a href='https://github.com/Alfresco/alfresco-ng2-components/blob/master/LICENSE'>
     <img src='https://img.shields.io/hexpm/l/plug.svg' alt='license' />
  </a>
</p>

## Introduction

See the following [page](INTRODUCTION.md) for an introduction to the Alfresco Application Development Framework.

## Prerequisites

Before you start using this development framework, make sure you have installed all required software and done all the 
necessary configuration, see this [page](PREREQUISITES.md).

## Components

To view the sources of all components that you can use to build your custom Alfresco (Content Services or Process Services) client follow this link:
[Components](/lib).

You can browse all the components at the [ADF Component Catalog](https://alfresco.github.io/adf-component-catalog/).

## Demo Application

A separate application showcasing integration of components can be found [here](https://github.com/Alfresco/alfresco-ng2-components/tree/master/demo-shell).

You will find examples of basic interaction for both BPM and ECM sets of widgets.

## Yeoman generators

To speed up the development of your Alfresco Angular application, or Alfresco Angular component, use one of the Yeoman generators. 

These generators will create a full working project with all the right libraries and tools.

<p align="center">
  <img title="yeoman generator" src='https://github.com/yeoman/media/blob/master/optimized/yeoman-150x150-opaque.png' alt='yeoman logo'  />
</p>

### Generate an Alfresco web component starter project

To generate your Alfresco Angular component you can use the following Yeoman generator:

- [Yeoman Generator Angular Alfresco component](https://github.com/Alfresco/generator-ng2-alfresco-component)


### Generate an Alfresco web application starter project

To generate your Alfresco Angular application you can use the following Yeoman generator:

- [Yeoman Generator Angular Alfresco application](https://github.com/Alfresco/generator-ng2-alfresco-app)

## Amazon AWS Elastic Beanstalk fast deploy

<p align="center">
    <img alt="AmazonWebservices Logo.svg" src="https://upload.wikimedia.org/wikipedia/commons/1/1d/AmazonWebservices_Logo.svg" width="250" height="94">
</p>

To deploy directly on your AWS instance our demo shell click the button below:

<a title="Deploy to AWS" href="https://console.aws.amazon.com/elasticbeanstalk/home?region=us-west-2#/newApplication?applicationName=Alfresco&solutionStackName=Node.js&tierName=WebServer&sourceBundleUrl=https://s3-us-west-2.amazonaws.com/elasticbeanstalk-us-west-2-677901592050/ADF_1.0.zip" target="_blank"><img src="http://d0.awsstatic.com/product-marketing/Elastic%20Beanstalk/deploy-to-aws.png" height="40"></a>

## Browser Support
All components are supported in the following browsers:

|**Browser**   	   |**Version**   	|
|---        	   |---  	        |
|Chrome     	   |Latest       	|
|Safari (OS X)     |9.x          	|
|Firefox*    	   |Latest       	|
|Edge       	   |13, 14     	    |
|Internet Explorer |11     	        |

* Due to a [Firefox known issue](https://bugzilla.mozilla.org/show_bug.cgi?id=1188880), the Alfresco Upload Component does not currently support folder upload functionality on Firefox.    

Please refer to the [Browser Support](BROWSER-SUPPORT.md) article for more details. 
