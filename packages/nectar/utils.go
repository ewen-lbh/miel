package main

import (
	"time"

	"github.com/emersion/go-imap/v2"
)

func contains[T comparable](s []T, e T) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

func firstmapEntry[K comparable, V any](m map[K]V) (K, V) {
	for k, v := range m {
		return k, v
	}
	panic("empty map")
}

func seqsetSize(seqset imap.SeqSet) int {
	nums, _ := seqset.Nums()
	return len(nums)
}

func isQuotedPrintable(s string) bool {
	return len(s) > 0 && s[0] == '='
}

func noop() {

}

func ellipsis(s string, max int) string {
	if len(s) > max {
		return s[:max-1] + "…"
	}
	return s
}

func same[T comparable](a, b []T) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

type timeoutWrapperResult[T any] struct {
	result T
	err    error
}

func timeout[T any](d time.Duration, f func() (T, error)) (*T, error, bool) {
	c := make(chan timeoutWrapperResult[T], 1)
	go func() {
		result, err := f()
		c <- timeoutWrapperResult[T]{result, err}
	}()
	select {
	case res := <-c:
		return &res.result, res.err, false
	case <-time.After(d):
		return nil, nil, true
	}
}
