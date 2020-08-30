create table pet
(
    name    varchar(20) null,
    owner   varchar(20) null,
    species varchar(20) null,
    sex     char        null,
    birth   date        null,
    death   date        null
);

create table tasks
(
    task_id     int auto_increment
        primary key,
    title       varchar(255)                        not null,
    start_date  date                                null,
    due_date    date                                null,
    status      tinyint                             not null,
    priority    tinyint                             not null,
    description text                                null,
    created_at  timestamp default CURRENT_TIMESTAMP not null
);

create table checklists
(
    todo_id      int auto_increment,
    task_id      int                  not null,
    todo         varchar(255)         not null,
    is_completed tinyint(1) default 0 not null,
    primary key (todo_id, task_id),
    constraint checklists_ibfk_1
        foreign key (task_id) references tasks (task_id)
            on delete cascade
);

create index task_id
    on checklists (task_id);

create table users
(
    id    int(11) unsigned auto_increment,
    name  varchar(192) null,
    email varchar(255) not null,
    constraint users_id_uindex
        unique (id)
);

alter table users
    add primary key (id);

