### Replication Package

This repository contains the replication package for the study “Impact of Code Smell Refactoring on Cloud Execution Costs in Web Applications”. The artifacts provided here support the reproduction of the experimental workflow described in the paper, including static analysis, the refactoring process, workload execution, and cost evaluation.

### Overview

The experiment follows a controlled before and after design. For each application, static analysis was performed to identify code smells, the original version was executed in the cloud under a fixed workload, manual refactoring was applied to remove the selected smells while preserving observable behavior, static analysis was repeated to confirm smell reduction, and the refactored version was then executed under the same workload to compare execution costs.

### Repository Structure

**projects/**
Contains the analyzed projects, including both original and refactored versions of each application.

**sonarqube_reports/**
Contains the reports exported from SonarQube used to quantify code smell occurrences before and after refactoring.

**cloud_run_costs/**
Contains the cost data collected from the cloud provider billing metrics, used to compare execution costs before and after refactoring under the same fixed workload.

### Analyzed Applications

The applications used in this study are open source projects from the e commerce domain. Links to the original repositories are provided below:

Ecommerce (DevAT): https://github.com/devat-youtuber/MERN-Ecommerce

ProShop v2 (Traversy): https://github.com/bradtraversy/proshop_mern

Ecommerce (MenathNDGD): https://github.com/MenathNDGD/MERN-Ecommerce

E Commerce Store (HuXn WebDev): https://github.com/HuXn-WebDev/MERN-E-Commerce-Store

Amazona (Basir): https://github.com/basir/mern-amazona

### Code Smells Considered

The study focuses on the following code smells:

Cognitive Complexity

Cyclomatic Complexity

Function Nesting

Array Delete

Array In Operator

Refactoring was restricted to these smells in order to maintain a consistent intervention scope across applications.

### Workload and Comparability

The workload was standardized across all applications, using the same set of interactions and the same total number of requests for every execution. As a result, the reported costs correspond to the total cost incurred to process a fixed workload, avoiding demand variations as a confounding factor.

### Notes

Refactoring was performed manually and limited to the selected code smells.

No new functionality was introduced, and observable application behavior was verified after refactoring.

Cost values correspond to the cost of processing a fixed workload and are not associated with execution periods such as daily or monthly usage.