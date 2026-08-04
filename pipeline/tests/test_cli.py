from __future__ import annotations

from pathlib import Path

from tehillim_pipeline.cli import DEFAULT_OUTPUT, parse_args


def test_parse_args_defaults_bhsa_path_to_none_without_env(monkeypatch):
    monkeypatch.delenv("TEHILLIM_BHSA_PATH", raising=False)
    args = parse_args([])
    assert args.bhsa_path is None
    assert args.output == DEFAULT_OUTPUT


def test_parse_args_reads_bhsa_path_from_env(monkeypatch):
    monkeypatch.setenv("TEHILLIM_BHSA_PATH", "/some/custom/path")
    args = parse_args([])
    assert args.bhsa_path == Path("/some/custom/path")


def test_parse_args_explicit_flags_override_env(monkeypatch):
    monkeypatch.setenv("TEHILLIM_BHSA_PATH", "/env/path")
    args = parse_args(["--bhsa-path", "/flag/path", "--output", "/tmp/out.json"])
    assert args.bhsa_path == Path("/flag/path")
    assert args.output == Path("/tmp/out.json")


def test_default_output_path_points_into_app_public_data():
    assert DEFAULT_OUTPUT.parent.parts[-3:] == ("app", "public", "data")
    assert DEFAULT_OUTPUT.name == "similarity.json"
