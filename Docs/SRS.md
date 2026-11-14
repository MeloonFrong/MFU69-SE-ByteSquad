# Software Requirements Specification
**Group 17, name: “ByteSquad”**  
**Introduction to Software Engineering (15031001)**

| Field | Details |
| :--- | :--- |
| **Project title** | InfoCenter |
| **SDLC chosen** | Reuse-Oriented Development — We will reuse and integrate existing software components, libraries, APIs, and AI services where appropriate instead of developing every component from scratch. |
| **Date** | Week 6 |

---

## 1. Introduction

### 1.1 Purpose and scope
People who are new to their workplace, such as new students, often miss important announcements, and sometimes the source of their information is scattered into many different places. Sometimes they even miss important information. Our InfoCenter is a place where users can receive every announcement from any sources they’ve chosen at the same time. Users can add a source by entering a URL link of that source, like a Facebook page URL. Then, our InfoCenter will show what they’ve posted. Our success is when users won’t need to go check every source to get information because they could’ve received it from InfoCenter instead.

### 1.2 Users and Stakeholders

| Name | Role | What they need | What they forbid/fear |
| :--- | :--- | :--- | :--- |
| Student/New hire/ etc. | Primary, user | Receive every post from their desired source | Being flooded with info that is hard to perceive |
| Announcer | Secondary, Stakeholder1 | Assure that everyone has received their announcements | Students miss announcements and blame them |
| Platform (Facebook, Instagram, etc) | Provider | Stable API contract and no misuse of their data | Their data being leaked |

---

## 2. Overall Description

### 2.1 Product context
- **Scope:**
  - **FR-1:** Add & Subscribe to External Source via Link.
  - **FR-2:** View Aggregated Content Feed.
  - **FR-3:** Categorize and Filter Subscriptions (Tagging).
- **Out of scope (example):** built-in commenting feature for each post, LINE notification.

### 2.2 Assumptions and constraints
- **Assumption:** every students/ newcomer has access to the internet and a smartphone, laptop, or PC
- **Constraint:** Thai and English UI text
- **Constraint:** no more than one API call per post
- **Constraint:** No paid API being used
- **Constraint:** Personal data - we only store their username, password, and their desired URL.

---

## 3. Functional requirements

### FR-1 — Add & Subscribe to External Source via Link
- **User Story:** As a user, I want to paste a link into the system, so that I can add it to my update list without visiting multiple apps.
- **Pain Point:** Scattered information wastes the user’s time and is easy to miss.
- **Requirements:** The system shall gather information from the source selected by the user via URL links.

### FR-2 — View Aggregated Content Feed
- **User Story:** As a user, I want to view all updates from my subscribed links in a single time feed, so that I can check all new updates without opening multiple apps.
- **Pain Point:** Switching between different apps to check for new information is inefficient.
- **Requirements:** The system shall show information gathered from the user’s selected source to the user.

### FR-3 — Categorize and Filter Subscriptions (Tagging)
- **User Story:** As a user, I want to assign custom tags (e.g., #MFU, #Manga, #TechNews) to my subscribed links, so that I can filter my feed and focus on specific topics.
- **Pain Point:** Finding a specific type of post hidden between other posts is exhausting.
- **Requirements:** The system shall let the user create a label and assign it to every submitted source, and the user shall be able to toggle which labeled sources shall be shown.

### FR-4 — Information Sorting System
- **User Story:** Usually, many pages are posting something that is not related to my interest. I want a system that only shows important information.
- **Pain Point:** Showing irrelevant posts makes finding actually important information difficult.
- **Requirements:** The system shall allow the user to filter posts using keywords to exclude or include certain types of posts.

---

## 4. Non-Functional Requirements

| ID | Type | Statement | Checking |
| :--- | :--- | :--- | :--- |
| NFR-1 | Performance | The software shall be fully loaded in 8 seconds on campus Wi-Fi. | Using a stopwatch on a classroom laptop, 5 trials |
| NFR-2 | Performance | For every 10 posts, they shall not use more than 10 seconds to load fully. | Using a stopwatch on a classroom laptop, 5 trials |
| NFR-3 | Usability | A first-time user shall be able to add the source of their announcement in 1 minute without asking a teammate. | Timed trial with a student who has not seen the app. |
| NFR-4 | Reliability | A new post from the user’s source shall appear in InfoCenter within 5 minutes. | Compare the time that the post appears in InfoCenter with the original post date. |
| NFR-5 | Security | The software shall not save any data other than saved URLs, user preferences, and search results. | Check saved files to see which data the system saved. |

---

## 5. Use cases

| Use case | Related FR | Actor | Goals |
| :--- | :--- | :--- | :--- |
| Add & Subscribe to External Source via Link | FR-1 : Add & Subscribe to External Source via Link | -User- | User adds URLs of their desired sources, and all of their post appear on the post list. |
| View Aggregated Content Feed | FR-2 : View Aggregated Content Feed | -User- | Posts on the post list can bring users to the original post. |
| Categorize and Filter Subscriptions (Tagging) | FR-3 : Categorize and Filter Subscriptions (Tagging) | -User- | User can categorize each source by tagging them in groups. |
| Information Sorting System | FR-4 : Information Sorting System | -User- | User can filter certain posts using keywords. |

---

## 6. Out of scope
- InfoCenter will only show content from the original post; further items like analysis, edits, or changes to the post content will not be included.
- The prototype version will not accept URLs beyond Facebook, Instagram, and TikTok.
- Any payment or subscription feature will not be included.
- InfoCenter will not provide a feature for users to interact with the original post through them, they will only show and bring you to the original post.
- Any form of notification when the program is closed will not be included.

---

## 7. Traceability matrix

| Pain Point | Functional Requirement | Solution | Feature built | Test |
| :--- | :--- | :--- | :--- | :--- |
| Information is scattered across multiple platforms, leading to wasted time and missed important news. | FR-1 : Add & Subscribe to External Source via Link | -to be continued- | -to be continued- | -to be continued- |
| Switching between different apps to check for new information is inefficient. | FR-2 : View Aggregated Content Feed | -to be continued- | -to be continued- | -to be continued- |
| Trying to find a specific type of post hidden between other posts is exhausting. | FR-3 : Categorize and Filter Subscriptions (Tagging) | -to be continued- | -to be continued- | -to be continued- |
| Showing irrelevant posts makes finding actually important information difficult. | FR-4 : Information Sorting System | -to be continued- | -to be continued- | -to be continued- |

---

## 8. Self-Check
- [ ] Every FR is a user story with a benefit.
- [ ] Every FR has acceptance criteria you could actually test
- [ ] No FR is vague
- [ ] NFRs exist, including security/privacy
- [ ] Every FR traces back to a stated problem
- [ ] Scope and out-of-scope are stated
- [ ] Use-case list matches the FR list

---

## Team Member :

| Student ID | Name |
| :--- | :--- |
| 6931503026 | Kunut Wongtidatorn |
| 6931503084 | Anansit Inta |
| 6931503004 | Htet Wai Yan |
| 6931503096 | Swan Naing Aung |
| 6931503091 | Aung Phone Pyae Oo |

