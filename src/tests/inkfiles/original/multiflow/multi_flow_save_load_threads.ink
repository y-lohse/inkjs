Default line 1
Default line 2

== red ==
Hello I'm red
<- thread1("red")
<- thread2("red")
-> DONE

== blue ==
Hello I'm blue
<- thread1("blue")
<- thread2("blue")
-> DONE

== thread1(name) ==
+ Thread 1 {name} choice
    -> thread1Choice(name)

== thread2(name) ==
+ Thread 2 {name} choice
    -> thread2Choice(name)

== thread1Choice(name) ==
After thread 1 choice ({name})
-> END

== thread2Choice(name) ==
After thread 2 choice ({name})
-> END
