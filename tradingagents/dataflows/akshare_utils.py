"""Utilities for integrating A-share market and social data via AKShare/Eastmoney."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional, Tuple, List

import pandas as pd
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime


try:
    import akshare as ak  # type: ignore
except Exception:  # pragma: no cover - handled downstream at runtime
    ak = None  # Fallback handled by _ensure_akshare


@dataclass(frozen=True)
class CNSymbol:
    """Normalized representation of an A-share ticker symbol."""

    code: str
    market: str
    prefixed: str
    yfinance: str


def _ensure_akshare():
    """Return the imported akshare module or raise a helpful error."""

    if ak is None:
        raise ImportError(
            "akshare is required for A-share data support. Install it via `pip install akshare`."
        )
    return ak


def normalize_cn_symbol(symbol: str) -> CNSymbol:
    """Normalize user-provided ticker strings to consistent A-share formats."""

    sym = symbol.strip().upper()

    if not sym:
        raise ValueError("Ticker symbol cannot be empty")

    # Handle suffixed formats like 600519.SH or 000001.SZ
    if "." in sym:
        code_part, suffix = sym.split(".", 1)
        suffix = suffix.upper()
        market = {
            "SH": "SH",
            "SS": "SH",
            "SZ": "SZ",
            "BJ": "BJ",
        }.get(suffix, "SZ")
        code = code_part
    elif sym.startswith(("SH", "SZ", "BJ")):
        market = sym[:2]
        code = sym[2:]
    else:
        code = sym
        if code.startswith(("6", "9")) or code.startswith("688") or code.startswith("689"):
            market = "SH"
        elif code.startswith(("4", "8")):
            market = "BJ"
        else:
            market = "SZ"

    code = code[:6]

    if not code.isdigit():
        raise ValueError(f"Unrecognized A-share ticker format: {symbol}")

    if market == "SH":
        yfinance = f"{code}.SS"
    elif market == "SZ":
        yfinance = f"{code}.SZ"
    else:
        yfinance = f"{code}.BJ"

    return CNSymbol(code=code, market=market, prefixed=f"{market}{code}", yfinance=yfinance)


def fetch_a_share_history(
    symbol: str,
    start_date: str,
    end_date: str,
    adjust: str = "qfq",
) -> pd.DataFrame:
    """Retrieve historical OHLCV data for A-share symbols via AKShare."""

    client = _ensure_akshare()
    normalized = normalize_cn_symbol(symbol)

    start = start_date.replace("-", "")
    end = end_date.replace("-", "")

    raw_df = client.stock_zh_a_hist(
        symbol=normalized.code,
        period="daily",
        start_date=start,
        end_date=end,
        adjust=adjust,
    )

    if raw_df.empty:
        return raw_df

    df = raw_df.rename(
        columns={
            "日期": "Date",
            "股票代码": "Code",
            "开盘": "Open",
            "收盘": "Close",
            "最高": "High",
            "最低": "Low",
            "成交量": "Volume",
            "成交额": "Turnover",
            "振幅": "Amplitude",
            "涨跌幅": "PctChange",
            "涨跌额": "Change",
            "换手率": "TurnoverRate",
        }
    ).copy()

    df["Symbol"] = normalized.prefixed
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce").dt.strftime("%Y-%m-%d")

    ordered_columns = [
        "Date",
        "Symbol",
        "Open",
        "High",
        "Low",
        "Close",
        "Volume",
        "Turnover",
        "PctChange",
        "Change",
        "Amplitude",
        "TurnoverRate",
    ]

    df = df[[col for col in ordered_columns if col in df.columns]]

    return df


def fetch_eastmoney_social_datasets(symbol: str) -> Dict[str, pd.DataFrame]:
    """Collect Eastmoney stockrank datasets (ranking, keywords, related stocks)."""

    client = _ensure_akshare()
    normalized = normalize_cn_symbol(symbol)
    prefixed_symbol = normalized.prefixed

    datasets: Dict[str, pd.DataFrame] = {}

    try:
        latest_df = client.stock_hot_rank_latest_em(symbol=prefixed_symbol)
        datasets["latest"] = latest_df
    except Exception as exc:
        datasets["latest_error"] = pd.DataFrame({"error": [str(exc)]})

    try:
        trend_df = client.stock_hot_rank_detail_em(symbol=prefixed_symbol)
        datasets["trend"] = trend_df
    except Exception as exc:
        datasets["trend_error"] = pd.DataFrame({"error": [str(exc)]})

    try:
        keywords_df = client.stock_hot_keyword_em(symbol=prefixed_symbol)
        datasets["keywords"] = keywords_df
    except Exception as exc:
        datasets["keywords_error"] = pd.DataFrame({"error": [str(exc)]})

    try:
        relate_df = client.stock_hot_rank_relate_em(symbol=prefixed_symbol)
        datasets["related"] = relate_df
    except Exception as exc:
        datasets["related_error"] = pd.DataFrame({"error": [str(exc)]})

    datasets["meta"] = pd.DataFrame(
        {
            "symbol": [normalized.prefixed],
            "code": [normalized.code],
            "market": [normalized.market],
        }
    )

    return datasets


def _netease_headers() -> Dict[str, str]:
    return {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
        ),
        "Referer": "https://quotes.money.163.com/",
        "Accept-Language": "zh-CN,zh;q=0.9",
    }


def _sina_headers() -> Dict[str, str]:
    return {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/123.0 Safari/537.36"
        ),
        "Referer": "https://finance.sina.com.cn/",
        "Accept-Language": "zh-CN,zh;q=0.9",
    }


def fetch_netease_stock_news(symbol: str, limit: int = 12) -> List[Dict[str, str]]:
    """Scrape NetEase F10 news for the specified A-share symbol."""

    normalized = normalize_cn_symbol(symbol)
    code = normalized.code
    url = f"https://quotes.money.163.com/f10/gsxw_{code}.html"

    try:
        resp = requests.get(url, headers=_netease_headers(), timeout=10)
    except Exception as exc:  # pragma: no cover - network dependent
        raise RuntimeError(f"Failed to request NetEase news: {exc}")

    if resp.status_code != 200:
        raise RuntimeError(f"NetEase responded with status {resp.status_code}")

    resp.encoding = resp.apparent_encoding or "utf-8"
    soup = BeautifulSoup(resp.text, "html.parser")

    candidates = []
    for selector in ("div.newsList", "div.list_news", "div#newsList", "div.newslist"):
        node = soup.select_one(selector)
        if node:
            candidates = node.select("li")
            if candidates:
                break

    if not candidates:
        candidates = soup.select("li")

    news_items: List[Dict[str, str]] = []
    seen = set()
    for li in candidates:
        anchor = li.find("a")
        if not anchor:
            continue
        title = anchor.get_text(strip=True)
        href = anchor.get("href", "").strip()
        if not href or href in seen:
            continue
        seen.add(href)

        date_text = ""
        date_node = li.find("span")
        if date_node:
            date_text = date_node.get_text(strip=True)
        else:
            match = re.search(r"(20\d{2}-\d{2}-\d{2})", li.get_text(" ", strip=True))
            if match:
                date_text = match.group(1)

        summary = li.get_text(" ", strip=True)
        if date_text and summary.startswith(date_text):
            summary = summary[len(date_text):].strip(" -:\u3000")
        summary = summary.replace(title, "", 1).strip(" -:\u3000")

        news_items.append(
            {
                "title": title,
                "url": href,
                "date": date_text,
                "summary": summary,
                "source": "网易财经",
                "symbol": code,
            }
        )

        if len(news_items) >= limit:
            break

    if not news_items:
        raise RuntimeError("未能从网易财经页面提取到相关新闻")

    return news_items


def fetch_sina_stock_news(symbol: str, limit: int = 12) -> List[Dict[str, str]]:
    normalized = normalize_cn_symbol(symbol)
    prefix = "sh" if normalized.market == "SH" else "sz"
    url = (
        "https://vip.stock.finance.sina.com.cn/corp/view/vCB_AllNewsStock.php"
        f"?symbol={prefix}{normalized.code}"
    )

    try:
        resp = requests.get(url, headers=_sina_headers(), timeout=8)
    except Exception as exc:  # pragma: no cover - network dependent
        raise RuntimeError(f"请求新浪财经失败: {exc}")

    if resp.status_code != 200:
        raise RuntimeError(f"新浪财经响应异常: {resp.status_code}")

    resp.encoding = resp.apparent_encoding or "utf-8"
    soup = BeautifulSoup(resp.text, "html.parser")
    container = soup.find(id="allNewsList") or soup.find(class_="datelist")
    if not container:
        raise RuntimeError("未找到新浪财经新闻列表")

    items: List[Dict[str, str]] = []
    for li in container.find_all("li"):
        anchor = li.find("a")
        if not anchor:
            continue
        title = anchor.get_text(strip=True)
        href = anchor.get("href", "").strip()
        if not href:
            continue
        date_text = ""
        date_span = li.find("span")
        if date_span:
            date_text = date_span.get_text(strip=True)
        summary = li.get_text(" ", strip=True)
        items.append(
            {
                "title": title,
                "url": href,
                "summary": summary.replace(title, "", 1).strip(" -:\u3000"),
                "date": date_text,
                "source": "新浪财经",
                "symbol": normalized.code,
            }
        )
        if len(items) >= limit:
            break

    if not items:
        raise RuntimeError("新浪财经返回为空")

    return items


def fetch_cninfo_announcements(symbol: str, limit: int = 10) -> List[Dict[str, str]]:
    normalized = normalize_cn_symbol(symbol)
    column = "sse" if normalized.market == "SH" else "szse"
    stock = f"{normalized.prefixed};"
    url = "https://www.cninfo.com.cn/new/hisAnnouncement/query"
    payload = {
        "pageNum": 1,
        "pageSize": limit,
        "column": column,
        "tabName": "fulltext",
        "plate": "",
        "stock": stock,
        "searchkey": "",
        "secid": "",
        "category": "",
        "trade": "",
        "seDate": "",
        "sortName": "",
        "sortType": "",
        "isHLtitle": "true",
    }

    headers = {
        "User-Agent": _netease_headers()["User-Agent"],
        "Referer": "https://www.cninfo.com.cn/",
        "Accept": "application/json, text/javascript, */*; q=0.01",
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
    except Exception as exc:  # pragma: no cover - network dependent
        raise RuntimeError(f"请求巨潮资讯失败: {exc}")

    data = resp.json()
    announcements = data.get("announcements") or []
    results: List[Dict[str, str]] = []
    for item in announcements[:limit]:
        title = item.get("announcementTitle", "").strip()
        adjunct = item.get("adjunctUrl", "").strip()
        if not title or not adjunct:
            continue
        url_full = "https://static.cninfo.com.cn/" + adjunct
        date_ts = item.get("announcementTime")
        if isinstance(date_ts, (int, float)):
            date_str = datetime.fromtimestamp(date_ts / 1000).strftime("%Y-%m-%d %H:%M")
        else:
            date_str = str(date_ts)
        results.append(
            {
                "title": title,
                "url": url_full,
                "summary": item.get("announcementTitle", ""),
                "date": date_str,
                "source": "巨潮资讯",
                "symbol": normalized.code,
            }
        )

    return results


def _dedupe_news_items(*groups: List[Dict[str, str]]) -> List[Dict[str, str]]:
    unique: Dict[Tuple[str, str], Dict[str, str]] = {}
    for group in groups:
        for item in group or []:
            title = (item.get("title") or "").strip()
            url = (item.get("url") or "").strip()
            if not title or not url:
                continue
            key = (title, url)
            if key not in unique:
                unique[key] = item
    return list(unique.values())


def _parse_date(value: str) -> datetime:
    value = (value or "").strip()
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%Y/%m/%d %H:%M"):
        try:
            return datetime.strptime(value, fmt)
        except Exception:
            continue
    try:
        return datetime.fromisoformat(value)
    except Exception:
        return datetime.min


def fetch_eastmoney_stock_news(symbol: str, limit: int = 12) -> List[Dict[str, str]]:
    """Retrieve company news via Eastmoney search as a fallback source."""

    client = _ensure_akshare()
    normalized = normalize_cn_symbol(symbol)
    code = normalized.code

    try:
        df = client.stock_news_em(code)
    except Exception as exc:
        raise RuntimeError(f"东方财富新闻接口异常: {exc}")

    if df is None or df.empty:
        raise RuntimeError("东方财富返回空数据")

    records: List[Dict[str, str]] = []
    df = df.head(limit)
    for _, row in df.iterrows():
        title = str(row.get("新闻标题", "")).strip()
        url = str(row.get("新闻链接", "")).strip()
        summary = str(row.get("新闻内容", "")).strip()
        date = str(row.get("发布时间", "")).strip()
        if date:
            try:
                date = datetime.fromtimestamp(int(date) / 1000).strftime("%Y-%m-%d %H:%M") if date.isdigit() else date[:16]
            except Exception:
                date = date[:16]

        records.append(
            {
                "title": title,
                "url": url,
                "summary": summary,
                "date": date,
                "source": str(row.get("文章来源", "东方财富")),
                "symbol": code,
            }
        )

    if not records:
        raise RuntimeError("东方财富未提供有效新闻记录")

    return records


def fetch_akshare_fundamental_snapshot(symbol: str) -> Dict[str, object]:
    """Gather valuation and financial indicator tables for an A-share via AKShare."""

    client = _ensure_akshare()
    normalized = normalize_cn_symbol(symbol)

    datasets: Dict[str, object] = {}

    valuation_metrics = ["总市值", "市盈率(TTM)", "市净率"]
    valuation_tables: Dict[str, pd.DataFrame] = {}
    for metric in valuation_metrics:
        try:
            df = client.stock_zh_valuation_baidu(
                symbol=normalized.code, indicator=metric, period="近一年"
            )
            if not df.empty:
                valuation_tables[metric] = df
        except Exception:
            continue

    if valuation_tables:
        datasets["valuations"] = valuation_tables  # type: ignore[assignment]

    try:
        key_df = client.stock_financial_abstract(symbol=normalized.code)
        datasets["financial_abstract"] = key_df
    except Exception:
        pass

    try:
        secu_code = f"{normalized.code}.{normalized.market}"
        main_indicator_df = client.stock_financial_analysis_indicator_em(
            symbol=secu_code, indicator="按报告期"
        )
        datasets["main_indicator"] = main_indicator_df
    except Exception:
        pass

    try:
        share_df = client.stock_zh_a_gbjg_em(
            symbol=f"{normalized.code}.{normalized.market}"
        )
        datasets["share_structure"] = share_df
    except Exception:
        pass

    return datasets
