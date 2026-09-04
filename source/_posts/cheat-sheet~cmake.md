---
title: cmake
date: 2024-01-01 00:00:00
tags:
    - cheat-sheet
    - cmake
categories: [速查表]

---

## CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.0.0)
project(swtest VERSION 0.1.0)
set(CMAKE_C_STANDARD 99)
include(CTest)
enable_testing()

set(ENV{TARGET_ROOT} "/workspaces/xxxxxx/target")
include_directories($ENV{TARGET_ROOT}/include/IFC_Bsw)
include_directories($ENV{TARGET_ROOT}/include/IFC_Base)
message("TARGET_ROOT: $ENV{TARGET_ROOT}")

# get_property(dirs DIRECTORY ${CMAKE_SOURCE_DIR} PROPERTY INCLUDE_DIRECTORIES)
# message(">>> include_dirs=${dirs}")

add_subdirectory(test)

set(CPACK_PROJECT_NAME ${PROJECT_NAME})
set(CPACK_PROJECT_VERSION ${PROJECT_VERSION})
include(CPack)
```

```cmake
find_package(GTest REQUIRED)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/include)
add_executable(main main.cpp)
target_link_libraries(main GTest::gtest GTest::gtest_main $ENV{HOLO_ROOT}/lib/libdemo.a)
```
