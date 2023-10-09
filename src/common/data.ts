export const data = {
  csTopic: {
    Database: `
* 데이터베이스
  - 데이터베이스를 사용하는 이유
  - 데이터베이스 성능
* Index
  - Index 란 무엇인가
  - Index 의 자료구조
  - Primary index vs Secondary index
  - Composite index
  - Index 의 성능과 고려해야할 사항
* 정규화에 대해서
  - 정규화 탄생 배경
  - 정규화란 무엇인가
  - 정규화의 종류
  - 정규화의 장단점
* Transaction
  - 트랜잭션(Transaction)이란 무엇인가?
  - 트랜잭션과 Lock
  - 트랜잭션의 특성
  - 트랜잭션을 사용할 때 주의할 점
* 교착상태
  - 교착상태란 무엇인가
  - 교착상태의 예(MySQL)
  - 교착 상태의 빈도를 낮추는 방법
* Statement vs PreparedStatement
* NoSQL
  - 정의
  - CAP 이론
    - 일관성
    - 가용성
    - 네트워크 분할 허용성
  - 저장방식에 따른 분류
    - Key-Value Model
    - Document Model
    - Column Model
`.trim(),

    DataStructure: `
* Array vs Linked List
* Stack and Queue
* Tree
  - Binary Tree
  - Full Binary Tree
  - Complete Binary Tree
  - BST (Binary Search Tree)
* Binary Heap
* Red Black Tree
  - 정의
  - 특징
  - 삽입
  - 삭제
* Hash Table
  - Hash Function
  - Resolve Collision
    - Open Addressing
    - Separate Chaining
  - Resize
* Graph
  - Graph 용어정리
  - Graph 구현
  - Graph 탐색
  - Minimum Spanning Tree
    - Kruskal algorithm
    - Prim algorithm
`.trim(),

    Network: `
* HTTP의 GET 과 POST 비교
* TCP 3-way-handshake
* TCP와 UDP의 비교
* HTTP와 HTTPS
  - HTTP의 문제점들
* DNS Round Robin 방식
* 웹 통신의 큰 흐름
`.trim(),

    OS: `
* 프로세스와 스레드의 차이
* 멀티스레드
  - 장점과 단점
  - 멀티스레드 vs 멀티프로세스
* 스케줄러
  - 장기 스케줄러
  - 단기 스케줄러
  - 중기 스케줄러
* CPU 스케줄러
  - FCFS
  - SJF
  - SRTF
  - Priority scheduling
  - RR
* 동기와 비동기의 차이
* 프로세스 동기화
  - Critical Section
  - 해결책
    - Lock
    - Semaphores
    - 모니터
* 메모리 관리 전략
  - 메모리 관리 배경
  - Paging
  - Segmentation
* 가상 메모리
  - 배경
  - 가상 메모리가 하는 일
  - Demand Paging(요구 페이징)
  - 페이지 교체 알고리즘
* 캐시의 지역성
  - Locality
  - Caching line
`.trim(),

    Java: `
* JVM 에 대해서, GC 의 원리
* Collection
* Annotation
  - Reference
* Generic
* final keyword
* Overriding vs Overloading
* Access Modifier
* Wrapper class
  - AutoBoxing
* Multi-Thread 환경에서의 개발
  - Field member
  - 동기화(Synchronized)
  - ThreadLocal
`.trim(),

    Javascript: `
* JavaScript Event Loop
* Hoisting
* Closure
* this 에 대해서
* Promise
* Arrow Function
`.trim(),

    Python: `
* Generator
* 클래스를 상속했을 때 메서드 실행 방식
* GIL 과 그로인한 성능 문제
* GC 작동 방식
* Celery
* PyPy 가 CPython 보다 빠른 이유
* 메모리 누수가 발생할 수 있는 경우
* Duck Typing
`.trim(),
  },
} as const;
