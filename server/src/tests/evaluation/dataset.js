/**
 * StudyNest Evaluation Dataset
 * 
 * Provides verified educational documents with known page numbers
 * and ground-truth QA pairs for rigorous RAG retrieval and generation benchmarking.
 */

export const EVALUATION_DOCUMENTS = [
  {
    id: 'os_concurrency',
    title: 'Operating Systems: Concurrency, Synchronization, and Deadlocks',
    filename: 'OS_Concurrency_Deadlocks.txt',
    pages: [
      {
        pageNumber: 1,
        text: `Chapter 5: Process Synchronization and Race Conditions

When multiple processes or threads execute concurrently and share resources (such as memory or files), race conditions can occur. A race condition is a situation where the outcome of execution depends on the particular order or timing of thread scheduling.

The Critical-Section Problem:
A critical section is a piece of code where shared resources are accessed. Any valid solution to the critical-section problem must satisfy three essential requirements:
1. Mutual Exclusion: If process P is executing in its critical section, no other processes can execute in their critical sections.
2. Progress: If no process is executing in its critical section and some processes want to enter, only those processes not in their remainder section can participate in deciding who enters next, and this selection cannot be postponed indefinitely.
3. Bounded Waiting: There must be a bound on the number of times other processes are allowed to enter their critical sections after a process has made a request to enter and before that request is granted.

Semaphores:
A semaphore S is an integer variable accessed only through two standard atomic operations: wait() (also known as P) and signal() (also known as V). Counting semaphores can range over an unrestricted domain, whereas binary semaphores (mutex locks) can only take values 0 or 1.`,
      },
      {
        pageNumber: 2,
        text: `Chapter 6: Classic Synchronization Problems

1. The Bounded-Buffer (Producer-Consumer) Problem:
In this classic problem, a pool of n buffers is shared between producer and consumer processes. Synchronization is achieved using three semaphores:
- mutex: a binary semaphore initialized to 1 providing mutual exclusion for buffer pool access.
- empty: a counting semaphore initialized to n representing the count of empty buffer slots.
- full: a counting semaphore initialized to 0 representing filled buffer slots.
The producer waits on empty, locks mutex, inserts an item, releases mutex, and signals full. The consumer waits on full, locks mutex, removes an item, releases mutex, and signals empty.

2. The Readers-Writers Problem:
Multiple concurrent readers may read the shared database simultaneously without conflict. However, if a writer and another process (reader or writer) access the database simultaneously, chaos ensues. Solutions prioritize either readers (preventing reader starvation) or writers (preventing writer starvation).

3. The Dining Philosophers Problem:
Five philosophers spend their lives thinking and eating. Five chopsticks are placed on a circular table. A philosopher needs both adjacent chopsticks (left and right) to eat. This problem illustrates deadlock and starvation in multi-resource allocation.`,
      },
      {
        pageNumber: 3,
        text: `Chapter 7: Deadlocks and Coffman Conditions

A deadlock is a situation in which every process in a set of processes is waiting for an event that only another process in the set can cause. In an operating system, deadlocks occur when processes request resources currently held by other waiting processes.

The Four Necessary Coffman Conditions:
For a deadlock to arise, the following four conditions must hold simultaneously in the system:
1. Mutual Exclusion: At least one resource must be held in a non-sharable mode. Only one process can use the resource at any given time.
2. Hold and Wait: A process must currently hold at least one resource and be waiting to acquire additional resources that are currently being held by other processes.
3. No Preemption: Resources cannot be preempted; a resource can be released only voluntarily by the process holding it, after that process has finished its task.
4. Circular Wait: A closed chain of processes exists, such that each process holds at least one resource needed by the next process in the chain (e.g., P0 waits for P1, P1 waits for P2, and Pn waits for P0).

Resource-Allocation Graph (RAG):
Deadlocks can be described precisely in terms of a directed graph. If the graph contains no cycles, no deadlock exists. If the graph contains a cycle and each resource type has only one instance, then a deadlock definitely exists.`,
      },
      {
        pageNumber: 4,
        text: `Chapter 8: Deadlock Prevention, Avoidance, and Banker's Algorithm

Strategies for handling deadlocks:
1. Deadlock Prevention: Provide methods to ensure that at least one of the four Coffman conditions cannot hold. For example, disallowing circular wait by imposing a strict total ordering of all resource types and requiring processes to request resources in increasing order.
2. Deadlock Avoidance: Requires the operating system to be given a priori information concerning which resources a process will request during its lifetime.

Dijkstra's Banker's Algorithm:
The Banker's Algorithm is a deadlock avoidance algorithm applicable to systems with multiple instances of each resource type.
When a process requests resources, the system checks whether allocating them leaves the system in a 'Safe State':
- A state is safe if there exists a safe execution sequence <P1, P2, ..., Pn> such that for each Pi, the resources that Pi can still request can be satisfied by currently available resources plus the resources held by all preceding processes Pj (where j < i).
- Data structures used:
  * Available: vector of length m indicating available instances of each resource.
  * Max: n x m matrix defining maximum demand of each process.
  * Allocation: n x m matrix defining resources currently allocated to each process.
  * Need: n x m matrix defining remaining resource need (Need[i][j] = Max[i][j] - Allocation[i][j]).
If granting a request results in an unsafe state, the requesting process must wait.`,
      },
    ],
  },
  {
    id: 'cn_transport',
    title: 'Computer Networks: Transport Layer and Congestion Control',
    filename: 'CN_Transport_Layer.txt',
    pages: [
      {
        pageNumber: 1,
        text: `Section 1: Transport Layer Services and UDP

The transport layer provides logical communication between application processes running on different hosts. While network-layer protocols (like IP) provide communication between host machines, transport-layer protocols provide process-to-process communication through multiplexing and demultiplexing using 16-bit port numbers.

User Datagram Protocol (UDP):
UDP (RFC 768) is a minimalist, connectionless transport protocol. It provides no-frills best-effort service without guarantees of delivery, ordering, or duplicate protection.
UDP Packet Header:
The UDP header is exactly 8 bytes (64 bits) long, consisting of four 2-byte fields:
1. Source Port: Identifies the sending application port.
2. Destination Port: Identifies the receiving application port.
3. Length: Total length of UDP header and payload in bytes.
4. Checksum: Used for error detection across the pseudo-header, UDP header, and data payload.

UDP is favored by DNS, VoIP, video streaming, and online gaming where low latency is critical and retransmission delays are unacceptable.`,
      },
      {
        pageNumber: 2,
        text: `Section 2: TCP Reliable Data Transfer and Three-Way Handshake

Transmission Control Protocol (TCP):
TCP (RFC 793) is a connection-oriented, reliable, byte-stream transport protocol.

The TCP Three-Way Handshake:
Before data transfer begins, the client and server establish a connection through a three-step exchange:
Step 1 (SYN): The client sends a TCP segment with the SYN bit set to 1, specifying its initial client sequence number (client_isn). No application data is sent.
Step 2 (SYN-ACK): The server receives SYN, allocates TCP buffers and variables, and sends back a segment with both SYN=1 and ACK=1. The acknowledgment field is set to client_isn + 1, and the server chooses its own initial sequence number (server_isn).
Step 3 (ACK): The client receives SYN-ACK, allocates buffers, and sends an ACK segment with ACK=1 and acknowledgment number set to server_isn + 1. This segment may contain payload data.

Reliable Transfer Mechanisms:
TCP achieves reliability using:
- Sequence numbers: Count bytes in the stream, not packets.
- Cumulative Acknowledgments: ACK number indicates the next expected byte.
- Retransmission Timers: Calculated via Exponentially Weighted Moving Average (EWMA) of Round-Trip Time (RTT).
- Fast Retransmit: If the sender receives 3 duplicate ACKs for the same segment, it immediately retransmits the missing segment before the retransmission timer expires.`,
      },
      {
        pageNumber: 3,
        text: `Section 3: TCP Flow Control and Congestion Control

Flow Control vs Congestion Control:
- Flow Control: Protects the receiver from having its receive buffer overrun by a fast sender. The receiver advertises its available buffer space in every TCP segment using the 16-bit Receive Window (rwnd) field. The sender ensures that unacknowledged in-flight bytes never exceed rwnd.
- Congestion Control: Protects the underlying network routers and communication links from being overwhelmed by too many packets injected into the network. The sender limits in-flight bytes to the minimum of cwnd (Congestion Window) and rwnd.

TCP Congestion Control Algorithm (AIMD):
TCP dynamically adjusts cwnd using Additive Increase Multiplicative Decrease:
1. Slow Start: cwnd starts at 1 Maximum Segment Size (MSS) and doubles every RTT (exponential growth) until it reaches the slow-start threshold (ssthresh).
2. Congestion Avoidance: Once cwnd >= ssthresh, cwnd increases linearly by 1 MSS per RTT.
3. Loss Detection:
   - On Timeout: Severe congestion. ssthresh is set to cwnd / 2, and cwnd is reset to 1 MSS (entering Slow Start).
   - On 3 Duplicate ACKs: Mild congestion. Fast Recovery is initiated: ssthresh is set to cwnd / 2, and cwnd is reduced to ssthresh + 3 MSS, avoiding a drop to 1 MSS.`,
      },
    ],
  },
];

export const GROUND_TRUTH_QA = [
  {
    id: 'eval_qa_1',
    question: 'What are the four necessary Coffman conditions required for a deadlock to occur?',
    targetDocumentId: 'os_concurrency',
    targetPageNumber: 3,
    expectedKeywords: ['mutual exclusion', 'hold and wait', 'no preemption', 'circular wait'],
    category: 'in_scope',
  },
  {
    id: 'eval_qa_2',
    question: "How does Dijkstra's Banker's algorithm determine whether a resource allocation is in a safe state?",
    targetDocumentId: 'os_concurrency',
    targetPageNumber: 4,
    expectedKeywords: ['banker', 'safe state', 'need', 'allocation', 'available'],
    category: 'in_scope',
  },
  {
    id: 'eval_qa_3',
    question: 'What three requirements must any valid solution to the critical-section problem satisfy?',
    targetDocumentId: 'os_concurrency',
    targetPageNumber: 1,
    expectedKeywords: ['mutual exclusion', 'progress', 'bounded waiting'],
    category: 'in_scope',
  },
  {
    id: 'eval_qa_4',
    question: 'Explain the three steps of the TCP three-way handshake connection establishment process.',
    targetDocumentId: 'cn_transport',
    targetPageNumber: 2,
    expectedKeywords: ['syn', 'syn-ack', 'ack', 'sequence number'],
    category: 'in_scope',
  },
  {
    id: 'eval_qa_5',
    question: 'What is the difference between TCP flow control and congestion control, and what role does rwnd play?',
    targetDocumentId: 'cn_transport',
    targetPageNumber: 3,
    expectedKeywords: ['flow control', 'congestion control', 'rwnd', 'cwnd', 'receiver'],
    category: 'in_scope',
  },
  {
    id: 'eval_qa_6',
    question: 'What is the header size of a UDP packet and what four specific fields does it contain?',
    targetDocumentId: 'cn_transport',
    targetPageNumber: 1,
    expectedKeywords: ['8 bytes', 'source port', 'destination port', 'length', 'checksum'],
    category: 'in_scope',
  },
  {
    id: 'eval_qa_7_refusal',
    question: 'What is the capital city of Australia and what is its total population?',
    targetDocumentId: null,
    targetPageNumber: null,
    expectedKeywords: [],
    category: 'out_of_scope',
    expectedRefusal: true,
  },
  {
    id: 'eval_qa_8_refusal',
    question: "How does Shor's quantum algorithm factor large integers in polynomial time on a quantum computer?",
    targetDocumentId: null,
    targetPageNumber: null,
    expectedKeywords: [],
    category: 'out_of_scope',
    expectedRefusal: true,
  },
];

